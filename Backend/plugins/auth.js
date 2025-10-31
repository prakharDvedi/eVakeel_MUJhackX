const fp = require('fastify-plugin');

module.exports = fp(async function (fastify, opts) {
    fastify.decorate('authenticate', async function (request, reply) {
        try {
            const authHeader = (request.headers.authorization || '').trim();
            let token = null;
            if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];

            if (!token && request.query && request.query.token) token = request.query.token;

            if (!token) {
                reply.code(401).send({ status: 'error', error: 'Missing auth token' });
                return;
            }

            const decoded = await fastify.verifyIdToken(token).catch(err => { throw err; });
            request.user = {
                uid: decoded.uid,
                email: decoded.email || null,
                name: decoded.name || null,
                claims: decoded,
            };
        } catch (err) {
            request.log.warn(err, 'Authentication failed');
            reply.code(401).send({ status: 'error', error: 'Invalid or expired token' });
        }
    });
});
