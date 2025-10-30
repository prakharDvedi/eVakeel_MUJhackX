// routes/auth.js
const { v4: uuidv4 } = require('uuid');

module.exports = async function (fastify, opts) {
    // Verify idToken -> create user record in Firestore if missing
    fastify.post('/verify', async (request, reply) => {
        try {
            const idToken = request.body && request.body.idToken ? request.body.idToken :
                (request.headers.authorization && request.headers.authorization.startsWith('Bearer ') ? request.headers.authorization.split(' ')[1] : null);

            if (!idToken) return reply.code(400).send({ status: 'error', error: 'Missing idToken' });

            const decoded = await fastify.verifyIdToken(idToken);
            const uid = decoded.uid;
            const usersRef = fastify.firestore.collection('users').doc(uid);
            const doc = await usersRef.get();
            if (!doc.exists) {
                const profile = {
                    uid,
                    email: decoded.email || null,
                    name: decoded.name || null,
                    createdAt: fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp(),
                    roles: ['user'],
                };
                await usersRef.set(profile);
            }
            const profileSnap = await usersRef.get();
            return reply.send({ status: 'ok', data: { uid, claims: decoded, profile: profileSnap.data() } });
        } catch (err) {
            request.log.warn(err);
            return reply.code(401).send({ status: 'error', error: 'Invalid token' });
        }
    });

    fastify.get('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const uid = request.user.uid;
            const doc = await fastify.firestore.collection('users').doc(uid).get();
            return reply.send({ status: 'ok', data: { user: request.user, profile: doc.exists ? doc.data() : null } });
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ status: 'error', error: 'Server error' });
        }
    });
};
