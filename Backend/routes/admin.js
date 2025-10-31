// routes/admin.js
const aiProxy = require('../services/aiProxy');

module.exports = async function (fastify, opts) {
    // middleware: require admin claim
    fastify.addHook('onRequest', async (req, reply) => {
        // allow unauthenticated admin routes? no - require authenticate first
    });

    fastify.post('/ingest', async (request, reply) => {
        // Auth disabled - skip admin check
        try {
            const { corpusUrl } = request.body;
            if (!corpusUrl) return reply.code(400).send({ status: 'error', error: 'corpusUrl required' });
            const resp = await aiProxy.callAI('admin/ingest', { corpusUrl });
            return reply.send({ status: 'ok', data: resp });
        } catch (err) {
            request.log.error(err);
            return reply.code(502).send({ status: 'error', error: 'Ingest failed' });
        }
    });

    fastify.post('/rebuild-index', async (request, reply) => {
        // Auth disabled - skip admin check
        try {
            const resp = await aiProxy.callAI('admin/rebuild-index', {});
            return reply.send({ status: 'ok', data: resp });
        } catch (err) {
            request.log.error(err);
            return reply.code(502).send({ status: 'error', error: 'Rebuild failed' });
        }
    });

    fastify.get('/metrics', async (request, reply) => {
        // Auth disabled - skip admin check
        try {
            const resp = await aiProxy.callAI('admin/metrics', {});
            return reply.send({ status: 'ok', data: resp });
        } catch (err) {
            request.log.error(err);
            return reply.code(502).send({ status: 'error', error: 'Metrics fetch failed' });
        }
    });
};
