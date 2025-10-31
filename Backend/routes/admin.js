const aiProxy = require('../services/aiProxy');

module.exports = async function (fastify, opts) {
    fastify.addHook('onRequest', async (req, reply) => {
    });

    fastify.post('/ingest', async (request, reply) => {
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
        try {
            const resp = await aiProxy.callAI('admin/rebuild-index', {});
            return reply.send({ status: 'ok', data: resp });
        } catch (err) {
            request.log.error(err);
            return reply.code(502).send({ status: 'error', error: 'Rebuild failed' });
        }
    });

    fastify.get('/metrics', async (request, reply) => {
        try {
            const resp = await aiProxy.callAI('admin/metrics', {});
            return reply.send({ status: 'ok', data: resp });
        } catch (err) {
            request.log.error(err);
            return reply.code(502).send({ status: 'error', error: 'Metrics fetch failed' });
        }
    });
};
