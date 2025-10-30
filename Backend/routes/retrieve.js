// routes/retrieve.js
const aiProxy = require('../services/aiProxy');

module.exports = async function (fastify, opts) {
    fastify.post('/search', async (request, reply) => {
        const { query, top_k = 5, domain = null } = request.body || {};
        if (!query) return reply.code(400).send({ status: 'error', error: 'query is required' });
        try {
            const resp = await aiProxy.callAI('retrieve', { query, top_k, domain });
            return reply.send({ status: 'ok', data: resp });
        } catch (err) {
            request.log.error(err);
            return reply.code(502).send({ status: 'error', error: 'Retrieve failed' });
        }
    });
};
