// server.js
require('dotenv').config();
const Fastify = require('fastify');
const path = require('path');

const fastify = Fastify({ logger: true });

fastify.register(require('@fastify/cors'), { origin: true });
fastify.register(require('@fastify/multipart'));
fastify.register(require('@fastify/websocket'));

// plugins: firebase and auth (below)
fastify.register(require('./plugins/firebase'));
fastify.register(require('./plugins/auth'));

// register routes
fastify.register(require('./routes/auth'), { prefix: '/auth' });
fastify.register(require('./routes/chat'), { prefix: '/api' });
fastify.register(require('./routes/chat_ws'), { prefix: '/ws' });
fastify.register(require('./routes/documents'), { prefix: '/documents' });
fastify.register(require('./routes/retrieve'), { prefix: '/retrieve' });
// file name is "tempalate.js"; ensure correct path here
fastify.register(require('./routes/tempalate'), { prefix: '/templates' });
fastify.register(require('./routes/incidents'), { prefix: '/incidents' });
// sessions route file is singular: session.js
fastify.register(require('./routes/session'), { prefix: '/sessions' });
fastify.register(require('./routes/admin'), { prefix: '/admin' });

fastify.get('/health', async () => ({ status: 'ok', ts: Date.now() }));

const start = async () => {
    try {
        const port = process.env.PORT || 5050;
        await fastify.listen({ port, host: '0.0.0.0' });
        fastify.log.info(`Server listening on ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
