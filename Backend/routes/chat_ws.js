// routes/chat_ws.js
const aiProxy = require('../services/aiProxy');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (fastify, opts) {
    // WebSocket endpoint: client connects and then sends an init JSON:
    // { type: 'init', messages: [...], jurisdiction:'india', domain:'tenant', context_doc_ids:[] }
    fastify.get('/chat', { websocket: true }, (connection, req) => {
        const ws = connection.socket;
        const queryToken = req.query && req.query.token ? req.query.token : null;

        // Step 1: authenticate token (query param or first message)
        (async () => {
            try {
                let token = queryToken;
                if (!token) {
                    // wait for first message which should be auth or init (client may send auth first)
                    const raw = await onceMessage(ws);
                    const msg = tryParse(raw);
                    if (msg && msg.type === 'auth' && msg.token) token = msg.token;
                    else {
                        // if no token, close
                        ws.send(JSON.stringify({ type: 'error', message: 'Missing auth token' }));
                        ws.close();
                        return;
                    }
                }
                // verify token
                let decoded;
                try {
                    decoded = await fastify.verifyIdToken(token);
                } catch (e) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Invalid auth token' }));
                    ws.close();
                    return;
                }
                // auth ok - now wait for init payload (if not already sent)
                let initMsg = null;
                if (!queryToken) {
                    // if we consumed an initial message for auth, we need to receive the init now
                    const raw = await onceMessage(ws);
                    initMsg = tryParse(raw);
                } else {
                    const raw = await onceMessage(ws);
                    initMsg = tryParse(raw);
                }
                if (!initMsg || initMsg.type !== 'init' || !Array.isArray(initMsg.messages)) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Invalid init payload' }));
                    ws.close();
                    return;
                }

                // Build session record
                const sessionId = uuidv4();
                const startTime = Date.now();
                // optionally store initial session doc, will update as stream proceeds
                const sessionRef = fastify.firestore.collection('sessions').doc(sessionId);
                await sessionRef.set({
                    sessionId,
                    userId: decoded.uid,
                    startedAt: fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp(),
                    messages: initMsg.messages,
                    status: 'streaming',
                });

                // Proxy to AI microservice streaming endpoint
                // We will forward chunks to client as {type:'token', data:'...'}
                const aiInitPayload = {
                    user_id: decoded.uid,
                    jurisdiction: initMsg.jurisdiction || 'india',
                    domain: initMsg.domain || null,
                    messages: initMsg.messages,
                    context_doc_ids: initMsg.context_doc_ids || [],
                    sessionId,
                };

                // streamToClient will forward tokens and resolve when stream ends
                await aiProxy.streamToClient('stream', aiInitPayload, ws, { maxBytes: process.env.MAX_STREAM_BYTES });

                // update session end
                await sessionRef.update({
                    endedAt: fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp(),
                    status: 'done',
                });

                // close ws if still open
                if (ws && ws.readyState === 1) {
                    ws.send(JSON.stringify({ type: 'done', data: { sessionId } }));
                    ws.close();
                }
            } catch (err) {
                try { ws.send(JSON.stringify({ type: 'error', message: 'Server error' })); } catch (e) { }
                try { ws.close(); } catch (e) { }
            }
        })();

        // helper to handle client 'cancel' messages while streaming
        ws.on('message', (msg) => {
            try {
                const parsed = tryParse(msg);
                if (parsed && parsed.type === 'cancel') {
                    // send cancel to client and close - we rely on aiProxy.streamToClient to detect ws.close
                    if (ws.readyState === 1) {
                        ws.send(JSON.stringify({ type: 'cancelled' }));
                        ws.close();
                    }
                }
            } catch (e) {
                // ignore
            }
        });
    });
};

// small helpers
function onceMessage(ws) {
    return new Promise((resolve, reject) => {
        const onMsg = (msg) => {
            cleanup();
            resolve(msg.toString());
        };
        const onClose = () => {
            cleanup();
            reject(new Error('socket closed'));
        };
        const onErr = (err) => {
            cleanup();
            reject(err);
        };
        function cleanup() {
            ws.off('message', onMsg);
            ws.off('close', onClose);
            ws.off('error', onErr);
        }
        ws.on('message', onMsg);
        ws.on('close', onClose);
        ws.on('error', onErr);
    });
}
function tryParse(raw) {
    try { return JSON.parse(raw.toString()); } catch (e) { return null; }
}
