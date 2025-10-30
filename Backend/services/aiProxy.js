// services/aiProxy.js
const axios = require('axios');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pump = promisify(pipeline);

const AI_BASE = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
const MAX_BYTES = parseInt(process.env.MAX_STREAM_BYTES || '65536', 10);

/**
 * Non-streaming generate: POST /ask on AI service
 * payload: { user_id, jurisdiction, domain, messages, context }
 */
async function generate(payload) {
    const url = `${AI_BASE.replace(/\/$/, '')}/ask`;
    const resp = await axios.post(url, payload, { timeout: 30000 });
    return resp.data;
}

/**
 * For templates, analyze, retrieve, incidents: call corresponding endpoints
 */
async function callAI(path, payload, timeout = 30000) {
    const url = `${AI_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    const resp = await axios.post(url, payload, { timeout });
    return resp.data;
}

/**
 * Stream tokens from AI service to the client websocket.
 * - aiStreamPath: path on AI service that supports streaming (e.g. '/stream')
 * - initPayload: JSON
 * - ws: websocket (connection.socket)
 * - opts: { maxBytes }
 *
 * This implementation expects the AI service returns an HTTP chunked stream (Content-Type: text/event-stream
 * or chunked text). We read raw chunks and forward them to the client as {type:'token', data:'<chunk>'}.
 *
 * If your AI service uses WebSocket for streaming, replace this logic with a WebSocket client that forwards messages.
 */
async function streamToClient(aiStreamPath, initPayload, ws, opts = {}) {
    const maxBytes = opts.maxBytes || MAX_BYTES;
    const url = `${AI_BASE.replace(/\/$/, '')}/${aiStreamPath.replace(/^\//, '')}`;

    // Use axios with responseType 'stream'
    const resp = await axios.post(url, initPayload, {
        responseType: 'stream',
        timeout: 0, // do not timeout for streaming (control by server)
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return new Promise((resolve, reject) => {
        let sentBytes = 0;
        const stream = resp.data;

        stream.on('data', (chunk) => {
            try {
                if (!ws || ws.readyState !== 1) {
                    // client closed
                    stream.destroy();
                    return;
                }

                // chunk may contain multiple tokens / newlines. Convert to string.
                const text = chunk.toString('utf8');

                // chunk may include SSE "data: ..." format; try to extract content
                // simple heuristic: strip "data: " prefixes and empty lines
                const lines = text.split(/\r?\n/).filter(Boolean);
                for (const line of lines) {
                    let content = line;
                    if (content.startsWith('data:')) content = content.replace(/^data:\s*/, '');
                    // skip control markers
                    if (content === '[DONE]') {
                        // signal done later
                        continue;
                    }
                    // send token
                    ws.send(JSON.stringify({ type: 'token', data: content }));
                    sentBytes += Buffer.byteLength(content, 'utf8');
                    if (sentBytes > maxBytes) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Stream truncated (max size reached)' }));
                        stream.destroy(); // stop reading
                        break;
                    }
                }
            } catch (err) {
                // log & ignore until 'error' handler
            }
        });

        stream.on('end', () => {
            try {
                if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'done' }));
            } catch (e) { }
            resolve();
        });

        stream.on('error', (err) => {
            try {
                if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'error', message: 'AI stream error' }));
            } catch (e) { }
            reject(err);
        });

        // If client closes socket, abort the stream
        ws.on('close', () => {
            if (stream.destroy) stream.destroy();
            resolve();
        });
    });
}

module.exports = { generate, callAI, streamToClient };
