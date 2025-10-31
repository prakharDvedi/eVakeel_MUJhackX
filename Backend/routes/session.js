module.exports = async function (fastify, opts) {
    fastify.get('/:sessionId', async (request, reply) => {
        const { sessionId } = request.params;
        const userId = 'anonymous';
        
        try {
            if (!fastify.firestore) {
                return reply.code(503).send({ status: 'error', error: 'Firestore not available' });
            }
            
            const sessionSnap = await fastify.firestore.collection('sessions').doc(sessionId).get();
            if (!sessionSnap.exists) {
                return reply.code(404).send({ status: 'error', error: 'Session not found' });
            }
            
            const sessionData = sessionSnap.data();
            
            let conversation = [];
            if (sessionData.conversation && Array.isArray(sessionData.conversation)) {
                conversation = sessionData.conversation;
            } else if (sessionData.messages && Array.isArray(sessionData.messages)) {
                conversation = sessionData.messages;
                if (sessionData.answer) {
                    conversation.push({
                        role: 'assistant',
                        content: sessionData.answer
                    });
                }
            }
            
            return reply.send({
                status: 'ok',
                data: {
                    sessionId,
                    conversation,
                    createdAt: sessionData.createdAt,
                    updatedAt: sessionData.updatedAt
                }
            });
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ status: 'error', error: 'Failed to retrieve session' });
        }
    });
    
    fastify.get('/', async (request, reply) => {
        const userId = 'anonymous';
        const limit = parseInt(request.query.limit || '10', 10);
        
        try {
            if (!fastify.firestore) {
                return reply.code(503).send({ status: 'error', error: 'Firestore not available' });
            }
            
            const sessionsSnapshot = await fastify.firestore
                .collection('sessions')
                .where('userId', '==', userId)
                .orderBy('updatedAt', 'desc')
                .limit(limit)
                .get();
            
            const sessions = [];
            sessionsSnapshot.forEach(doc => {
                const data = doc.data();
                let preview = '';
                let messageCount = 0;
                
                if (data.conversation && Array.isArray(data.conversation)) {
                    const lastAssistantMsg = data.conversation.filter(m => m.role === 'assistant').pop();
                    preview = lastAssistantMsg?.content?.substring(0, 100) || '';
                    messageCount = data.conversation.length;
                } else {
                    preview = data.answer?.substring(0, 100) || '';
                    messageCount = data.messages?.length || 0;
                }
                
                sessions.push({
                    sessionId: doc.id,
                    preview,
                    messageCount,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                });
            });
            
            return reply.send({
                status: 'ok',
                data: { sessions }
            });
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ status: 'error', error: 'Failed to list sessions' });
        }
    });
};

