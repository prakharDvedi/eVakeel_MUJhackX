// routes/session.js
module.exports = async function (fastify, opts) {
    // List sessions for current user
    fastify.get('/', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const uid = request.user.uid;
            const snap = await fastify.firestore.collection('sessions')
                .where('userId', '==', uid)
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
            const items = [];
            snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
            return reply.send({ status: 'ok', data: items });
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ status: 'error', error: 'Failed to list sessions' });
        }
    });

    // Get a session by id
    fastify.get('/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const id = request.params.id;
            const doc = await fastify.firestore.collection('sessions').doc(id).get();
            if (!doc.exists) return reply.code(404).send({ status: 'error', error: 'Not found' });
            const data = doc.data();
            if (data.userId !== request.user.uid && !(request.user.claims && request.user.claims.admin)) {
                return reply.code(403).send({ status: 'error', error: 'Forbidden' });
            }
            return reply.send({ status: 'ok', data: { id: doc.id, ...data } });
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ status: 'error', error: 'Failed to get session' });
        }
    });

    // Delete a session
    fastify.delete('/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const id = request.params.id;
            const ref = fastify.firestore.collection('sessions').doc(id);
            const doc = await ref.get();
            if (!doc.exists) return reply.code(404).send({ status: 'error', error: 'Not found' });
            const data = doc.data();
            if (data.userId !== request.user.uid && !(request.user.claims && request.user.claims.admin)) {
                return reply.code(403).send({ status: 'error', error: 'Forbidden' });
            }
            await ref.delete();
            return reply.send({ status: 'ok' });
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ status: 'error', error: 'Failed to delete session' });
        }
    });
};

