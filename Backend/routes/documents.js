// routes/documents.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const aiProxy = require('../services/aiProxy');

module.exports = async function (fastify, opts) {
    // Upload file and trigger ingest
    fastify.post('/upload', async (request, reply) => {
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

            // Store metadata (if Firebase available, else skip)
            const metadata = {
                documentId: docId,
                ownerUid: 'anonymous',
                filename,
                storageUrl,
                status: 'uploaded',
            };
            
            // Firebase disabled - skip saving metadata
            // if (fastify.firestore) {
            //     await fastify.firestore.collection('documents').doc(docId).set({
            //         ...metadata,
            //         uploadedAt: fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            //     });
            // }
            
            // Return document info with local file path for Python service
            return reply.code(201).send({ 
                status: 'ok', 
                data: { 
                    documentId: docId, 
                    storageUrl,
                    filePath: storageUrl.startsWith('file:') ? storageUrl.replace('file:', '') : storageUrl,
                    filename
                } 
            });

        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ status: 'error', error: 'Upload failed' });
        }
    });

    // Analyze a document (ask AI microservice for analysis)
    // Supports both: /documents/:id/analyze (with doc ID) OR /documents/analyze (with file path in body)
    fastify.post('/:id/analyze', async (request, reply) => {
        const docId = request.params.id;
        try {
            const body = request.body || {};
            const inputText = body.input_text || body.query || null;
            
            // Get file path from storageUrl (if Firebase available) or from body
            let imagePath = null;
            let pdfPath = null;
            
            // Check if file path is provided directly in body (for prototype)
            if (body.file_path || body.pdf_path) {
                pdfPath = body.file_path || body.pdf_path;
            } else if (body.image_path) {
                imagePath = body.image_path;
            }
            // Firebase disabled - can't get from Firestore
            // Files must be provided directly via body.file_path or body.pdf_path
            
            if (!imagePath && !pdfPath) {
                return reply.code(400).send({ status: 'error', error: 'No file path provided. Provide file_path or pdf_path in request body.' });
            }
            
            // call AI analyze with file paths
            const aiResp = await aiProxy.callAI('analyze', {
                document_id: docId,
                input_text: inputText,
                image_path: imagePath,
                pdf_path: pdfPath
            });
            
            // store analysis (if Firebase available)
            // Firebase disabled - skip saving analysis
            // if (fastify.firestore) {
            //     await fastify.firestore.collection('documents').doc(docId).collection('analysis').add({
            //         analysis: aiResp,
            //         requestedBy: 'anonymous',
            //         createdAt: fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            //     });
            //     await fastify.firestore.collection('documents').doc(docId).update({ 
            //         status: 'analyzed', 
            //         lastAnalyzedAt: fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp() 
            //     });
            // }
            
            return reply.send({ status: 'ok', data: aiResp });
        } catch (err) {
            request.log.error(err);
            return reply.code(502).send({ status: 'error', error: 'Analysis failed', details: err.message });
        }
    });
    
    // Direct analyze endpoint (without doc ID - for prototype)
    fastify.post('/analyze', async (request, reply) => {
        try {
            const body = request.body || {};
            const inputText = body.input_text || body.query || null;
            const pdfPath = body.pdf_path || body.file_path;
            const imagePath = body.image_path;
            
            if (!pdfPath && !imagePath) {
                return reply.code(400).send({ status: 'error', error: 'pdf_path or image_path required' });
            }
            
            const aiResp = await aiProxy.callAI('analyze', {
                input_text: inputText,
                image_path: imagePath,
                pdf_path: pdfPath
            });
            
            return reply.send({ status: 'ok', data: aiResp });
        } catch (err) {
            request.log.error(err);
            return reply.code(502).send({ status: 'error', error: 'Analysis failed', details: err.message });
        }
    });
};
