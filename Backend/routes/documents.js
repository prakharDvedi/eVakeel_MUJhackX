// routes/documents.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const aiProxy = require('../services/aiProxy');

module.exports = async function (fastify, opts) {
    // Upload file and trigger ingest
    fastify.post('/upload', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const parts = await request.saveRequestFiles(); // fastify-multipart helper
            if (!parts || parts.length === 0) return reply.code(400).send({ status: 'error', error: 'No file uploaded' });
            const file = parts[0];
            const tmpPath = file.filepath || file.file; // depending on fastify-multipart version
            const docId = uuidv4();
            const filename = file.filename || `upload-${Date.now()}`;

            // Upload to Firebase Storage if configured, else keep temp path and store metadata only
            let storageUrl = null;
            if (fastify.firebaseStorage) {
                const bucket = fastify.firebaseStorage.bucket();
                const dest = `documents/${docId}/${filename}`;
                await bucket.upload(tmpPath, { destination: dest });
                const fileRef = bucket.file(dest);
                await fileRef.makePublic().catch(() => { }); // optional: make public or use signed URLs
                storageUrl = `gs://${bucket.name}/${dest}`;
            } else {
                // Move to server uploads dir as fallback
                const destDir = path.join(os.tmpdir(), 'evakeel_uploads');
                if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
                const dest = path.join(destDir, `${docId}-${filename}`);
                fs.renameSync(tmpPath, dest);
                storageUrl = `file:${dest}`;
            }

            const metadata = {
                documentId: docId,
                ownerUid: request.user.uid,
                filename,
                storageUrl,
                status: 'uploaded',
                uploadedAt: fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            };
            await fastify.firestore.collection('documents').doc(docId).set(metadata);

            // Trigger AI microservice ingestion
            try {
                const ingestResp = await aiProxy.callAI('ingest', { document_id: docId, storageUrl, ownerUid: request.user.uid });
                // ingestResp should include jobId and status
                await fastify.firestore.collection('documents').doc(docId).update({ ingestJobId: ingestResp.jobId || null, status: 'ingest_started' });
                return reply.code(201).send({ status: 'ok', data: { documentId: docId, jobId: ingestResp.jobId, storageUrl } });
            } catch (err) {
                // ingestion failed but upload ok
                request.log.error(err);
                await fastify.firestore.collection('documents').doc(docId).update({ status: 'ingest_failed' });
                return reply.code(202).send({ status: 'ok', data: { documentId: docId, storageUrl, note: 'uploaded but ingest failed' } });
            }

        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ status: 'error', error: 'Upload failed' });
        }
    });

    // Analyze a document (ask AI microservice for analysis)
    fastify.post('/:id/analyze', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const docId = request.params.id;
        try {
            const docSnap = await fastify.firestore.collection('documents').doc(docId).get();
            if (!docSnap.exists) return reply.code(404).send({ status: 'error', error: 'Document not found' });
            const doc = docSnap.data();
            if (doc.ownerUid !== request.user.uid && !(request.user.claims && request.user.claims.admin)) {
                return reply.code(403).send({ status: 'error', error: 'Not owner' });
            }
            const body = request.body || {};
            const type = body.analysis_type || 'full';
            // call AI analyze
            const aiResp = await aiProxy.callAI('analyze', { document_id: docId, analysis_type: type });
            // store analysis
            await fastify.firestore.collection('documents').doc(docId).collection('analysis').add({
                analysis: aiResp,
                requestedBy: request.user.uid,
                createdAt: fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            });
            // update document status
            await fastify.firestore.collection('documents').doc(docId).update({ status: 'analyzed', lastAnalyzedAt: fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp() });
            return reply.send({ status: 'ok', data: aiResp });
        } catch (err) {
            request.log.error(err);
            return reply.code(502).send({ status: 'error', error: 'Analysis failed' });
        }
    });
};
