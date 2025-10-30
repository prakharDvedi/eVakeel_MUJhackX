// routes/chat_ws.js
const llmClient = require('../services/llmClient');
const rag = require('../services/ragService');

module.exports = async function (fastify, opts) {
    fastify.get('/ws/chat', { websocket: true }, (connection /* SocketStream */, req /* FastifyRequest */) => {
        // Auth: we accept token via query param ?token=...
        const token = req.query.token;
        if (!token) {
            connection.socket.send(JSON.stringify({ type: 'error', message: 'Missing token' }));
            return connection.socket.close();
        }

        // verify token
        fastify.jwt.verify(token, (err, decoded) => {
            if (err) {
                connection.socket.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
                return connection.socket.close();
            }
            // OK - proceed to receive initial payload from client
            connection.socket.once('message', async (raw) => {
                let init;
                try {
                    init = JSON.parse(raw.toString());
                } catch (e) {
                    connection.socket.send(JSON.stringify({ type: 'error', message: 'Invalid init payload' }));
                    return connection.socket.close();
                }

                const prompt = (init.messages || []).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

                // Optionally: RAG retrieval
                let context = [];
                try {
                    if (!init.context_doc_ids || init.context_doc_ids.length === 0) {
                        context = await rag.retrieve(prompt, { top_k: 5, domain: init.domain });
                    } else {
                        context = await rag.getDocsByIds(init.context_doc_ids);
                    }
                } catch (e) {
                    connection.socket.send(JSON.stringify({ type: 'error', message: 'Retrieval failed' }));
                    connection.socket.close();
                    return;
                }

                // Now stream from LLM
                try {
                    const stream = llmClient.streamGenerate(prompt, context, { max_tokens: 1200 });

                    // backpressure / safety: track bytes sent
                    let sentBytes = 0;
                    const MAX_BYTES = 1024 * 64; // 64KB guard for a single streaming response

                    for await (const chunk of stream) {
                        if (!connection.socket || connection.socket.readyState !== 1) break; // closed
                        // chunk: string
                        sentBytes += Buffer.byteLength(chunk, 'utf8');
                        if (sentBytes > MAX_BYTES) {
                            connection.socket.send(JSON.stringify({ type: 'error', message: 'Stream truncated (max size).' }));
                            break;
                        }
                        connection.socket.send(JSON.stringify({ type: 'token', data: chunk }));
                    }
                    // final metadata (you may include sources)
                    connection.socket.send(JSON.stringify({ type: 'done', data: { sources: [], confidence: 0.8 } }));
                    connection.socket.close();
                } catch (err) {
                    connection.socket.send(JSON.stringify({ type: 'error', message: 'Streaming failed' }));
                    connection.socket.close();
                }
            }); 

        }); 
    });
};

