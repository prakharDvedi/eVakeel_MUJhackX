// routes/incidents.js
const aiProxy = require('../services/aiProxy');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (fastify, opts) {
    fastify.post('/advise', async (request, reply) => {
        const { incident_type = 'general', description = '', jurisdiction = 'india', evidence_doc_ids = [] } = request.body || {};
        if (!description) return reply.code(400).send({ status: 'error', error: 'description required' });
        try {
            const payload = { user_id: 'anonymous', incident_type, description, jurisdiction, evidence_doc_ids };
            const resp = await aiProxy.callAI('incidents/advise', payload);
            // Firebase disabled - skip storing incident
            const id = uuidv4();
            return reply.send({ status: 'ok', data: resp });
        } catch (err) {
            request.log.error(err);
            return reply.code(502).send({ status: 'error', error: 'Incident advice failed' });
        }
    });
};
