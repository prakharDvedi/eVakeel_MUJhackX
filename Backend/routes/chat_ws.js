const aiProxy = require('../services/aiProxy');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (fastify, opts) {
    fastify.get('/chat', { websocket: true }, (connection, req) => {
        const ws = connection.socket;
        const queryToken = req.query && req.query.token ? req.query.token : null;

        (async () => {
            try {
                let decoded = { uid: 'anonymous', email: null, name: null };
                
                const raw = await onceMessage(ws);
                const initMsg = tryParse(raw);
                
                if (!initMsg || initMsg.type !== 'init' || !Array.isArray(initMsg.messages)) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Invalid init payload. Expected: {type:"init", messages:[]}' }));
                    ws.close();
                    return;
                }

                const sessionId = uuidv4();
                const startTime = Date.now();
                // const sessionRef = fastify.firestore.collection('sessions').doc(sessionId);
                // await sessionRef.set({
                //     sessionId,
                //     userId: decoded.uid,
                //     startedAt: fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp(),
                //     messages: initMsg.messages,
                //     status: 'streaming',
                // });

                const aiInitPayload = {
                    user_id: decoded.uid,
                    jurisdiction: initMsg.jurisdiction || 'india',
                    domain: initMsg.domain || null,
                    messages: initMsg.messages,
                    context_doc_ids: initMsg.context_doc_ids || [],
                    sessionId,
                };

                await aiProxy.streamToClient('stream', aiInitPayload, ws, { maxBytes: process.env.MAX_STREAM_BYTES });

                // Firebase disabled - skip session update
                // await sessionRef.update({
                //     endedAt: fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp(),
                //     status: 'done',
                // });

                if (ws && ws.readyState === 1) {
                    ws.send(JSON.stringify({ type: 'done', data: { sessionId } }));
                    ws.close();
                }
            } catch (err) {
                try { ws.send(JSON.stringify({ type: 'error', message: 'Server error' })); } catch (e) { }
                try { ws.close(); } catch (e) { }
            }
        })();

        ws.on('message', (msg) => {
            try {
                const parsed = tryParse(msg);
                if (parsed && parsed.type === 'cancel') {
                    if (ws.readyState === 1) {
                        ws.send(JSON.stringify({ type: 'cancelled' }));
                        ws.close();
                    }
                }
            } catch (e) {
            }
        });
    });
};

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
