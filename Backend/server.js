// server.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Fastify = require('fastify');

const fastify = Fastify({ 
    logger: true,
    bodyLimit: 1048576 // 1MB limit for JSON bodies
});

fastify.register(require('@fastify/cors'), { origin: true });
fastify.register(require('@fastify/multipart'));
fastify.register(require('@fastify/websocket'));

// plugins: auth (firebase disabled)
// fastify.register(require('./plugins/firebase'));  // Disabled - no Firebase
// fastify.register(require('./plugins/auth'));  // Disabled - requires Firebase

// register routes (auth disabled - no Firebase)
// fastify.register(require('./routes/auth'), { prefix: '/auth' });  // Disabled
fastify.register(require('./routes/chat'), { prefix: '/api' });
fastify.register(require('./routes/chat_ws'), { prefix: '/ws' });
fastify.register(require('./routes/documents'), { prefix: '/documents' });
fastify.register(require('./routes/retrieve'), { prefix: '/retrieve' });
fastify.register(require('./routes/tempalate'), { prefix: '/templates' });
fastify.register(require('./routes/incidents'), { prefix: '/incidents' });
fastify.register(require('./routes/session'), { prefix: '/sessions' });
fastify.register(require('./routes/admin'), { prefix: '/admin' });

fastify.get('/health', async () => ({ status: 'ok', ts: Date.now() }));

const start = async () => {
    try {
        // Check if OPENAI_API_KEY is loaded
        if (!process.env.OPENAI_API_KEY) {
            fastify.log.warn('Warning: OPENAI_API_KEY not found in environment variables');
            fastify.log.warn('Make sure OPENAI_API_KEY is set in Backend/.env file');
        } else {
            fastify.log.info('OPENAI_API_KEY loaded successfully');
        }
        
        const port = process.env.PORT || 5050;
        await fastify.listen({ port, host: '0.0.0.0' });
        fastify.log.info(`Server listening on ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
