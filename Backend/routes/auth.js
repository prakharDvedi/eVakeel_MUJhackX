// routes/auth.js
const { v4: uuidv4 } = require('uuid');

module.exports = async function (fastify, opts) {
    // Verify idToken -> create user record in Firestore if missing
    fastify.post('/verify', async (request, reply) => {
        try {
            const idToken = request.body && request.body.idToken ? request.body.idToken :
                (request.headers.authorization && request.headers.authorization.startsWith('Bearer ') ? request.headers.authorization.split(' ')[1] : null);

            if (!idToken) return reply.code(400).send({ status: 'error', error: 'Missing idToken' });

            // Firebase disabled - skip token verification
            const decoded = { uid: 'anonymous', email: null, name: null };
            const uid = decoded.uid;
            // Firebase disabled - return anonymous user
            return reply.send({ status: 'ok', data: { uid, claims: decoded, profile: { uid: 'anonymous', roles: ['user'] } } });
        } catch (err) {
            request.log.warn(err);
            return reply.code(401).send({ status: 'error', error: 'Invalid token' });
        }
    });

    fastify.get('/me', async (request, reply) => {
        try {
            const uid = 'anonymous';
            // Firebase disabled - return anonymous user
            return reply.send({ status: 'ok', data: { user: { uid: 'anonymous' }, profile: null } });
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ status: 'error', error: 'Server error' });
        }
    });
};
