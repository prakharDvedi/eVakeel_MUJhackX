// routes/chat.js
const aiProxy = require('../services/aiProxy');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (fastify, opts) {
    fastify.post('/chat', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const body = request.body || {};
        const { messages, jurisdiction = 'india', domain = null, context_doc_ids = [] } = body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return reply.code(400).send({ status: 'error', error: 'messages is required' });
        }

        const userId = request.user && request.user.uid ? request.user.uid : null;
        // Build context: if context_doc_ids present, fetch short snippets from Firestore
        const context = [];
        try {
            if (context_doc_ids && context_doc_ids.length > 0) {
                const docsColl = fastify.firestore.collection('documents');
                for (const id of context_doc_ids.slice(0, 5)) {
                    const docSnap = await docsColl.doc(id).get();
                    if (docSnap.exists) {
                        const data = docSnap.data();
                        // prefer stored snippet or extracted_text reference
                        context.push({ doc_id: id, title: data.title || data.filename, snippet: data.summary || null });
                    }
                }
            } else {
                // optionally call retrieve service for context suggestions - not mandatory
            }

            // create payload for AI microservice
            const payload = {
                user_id: userId,
                jurisdiction,
                domain,
                messages,
                context,
            };

            // call AI microservice (non-stream)
            const aiResp = await aiProxy.generate(payload); // expects { answer, sources, meta }
            // save session
            const sessionId = uuidv4();
            await fastify.firestore.collection('sessions').doc(sessionId).set({
                sessionId,
                userId,
                messages,
                answer: aiResp.answer || aiResp.text || aiResp,
                sources: aiResp.sources || [],
                createdAt: fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            });

            return reply.send({ status: 'ok', data: { sessionId, answer: aiResp.answer || aiResp.text || aiResp, sources: aiResp.sources || [] } });
        } catch (err) {
            request.log.error(err);
            return reply.code(502).send({ status: 'error', error: 'AI service error' });
        }
    });
};
