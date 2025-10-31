// routes/templates.js
const aiProxy = require('../services/aiProxy');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (fastify, opts) {
    fastify.post('/generate', async (request, reply) => {
        const { template_type, inputs = {}, language = 'en', tone = 'formal' } = request.body || {};
        if (!template_type) return reply.code(400).send({ status: 'error', error: 'template_type required' });
        try {
            const resp = await aiProxy.callAI('generate-template', { user_id: 'anonymous', template_type, inputs, language, tone });
            // Firebase disabled - skip storing metadata
            const id = uuidv4();
            return reply.send({ status: 'ok', data: { templateId: id, url: resp.document_url, preview: resp.preview } });
        } catch (err) {
            request.log.error(err);
            return reply.code(502).send({ status: 'error', error: 'Template generation failed' });
        }
    });
};
