// routes/chat.js
const aiProxy = require('../services/aiProxy');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (fastify, opts) {
    fastify.post('/chat', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    messages: { type: 'array' },
                    sessionId: { type: 'string' },
                    jurisdiction: { type: 'string' },
                    domain: { type: 'string' },
                    context_doc_ids: { type: 'array' },
                    image_path: { type: 'string' },
                    pdf_path: { type: 'string' },
                    file_path: { type: 'string' }
                },
                required: ['messages']
            }
        }
    }, async (request, reply) => {
        const body = request.body || {};
        const { messages, sessionId, jurisdiction = 'india', domain = null, context_doc_ids = [] } = body;
        
        const userId = 'anonymous'; // No auth - use anonymous user
        const path = require('path');
        
        // Load previous conversation history if sessionId provided
        let conversationHistory = []; // Full conversation: user + assistant messages
        let existingSessionId = sessionId;
        
        // Firebase disabled - skip session history loading
        // if (sessionId && fastify.firestore) {
        //     try {
        //         const sessionSnap = await fastify.firestore.collection('sessions').doc(sessionId).get();
        //         if (sessionSnap.exists) {
        //             const sessionData = sessionSnap.data();
        //             if (sessionData.conversation && Array.isArray(sessionData.conversation)) {
        //                 conversationHistory = sessionData.conversation;
        //             } else if (sessionData.messages && Array.isArray(sessionData.messages)) {
        //                 conversationHistory = sessionData.messages;
        //                 if (sessionData.answer) {
        //                     conversationHistory.push({
        //                         role: 'assistant',
        //                         content: sessionData.answer
        //                     });
        //                 }
        //             }
        //         }
        //     } catch (err) {
        //         request.log.warn('Failed to load session history:', err);
        //     }
        // }
        
        // Build full conversation: previous history + new user messages
        const fullConversation = [...conversationHistory];
        
        // Validate: need at least one user message (either from history or new)
        if (messages && Array.isArray(messages) && messages.length > 0) {
            // Add new user messages to conversation
            fullConversation.push(...messages);
        } else if (conversationHistory.length === 0) {
            // No history and no new messages - error
            return reply.code(400).send({ status: 'error', error: 'messages is required for new conversation' });
        }
        
        // Build context and collect file paths from context_doc_ids
        const context = [];
        let imagePath = null;
        let pdfPath = null;
        
        try {
            // Firebase disabled - skip context_doc_ids lookup
            // if (context_doc_ids && context_doc_ids.length > 0 && fastify.firestore) {
            //     const docsColl = fastify.firestore.collection('documents');
            //     for (const id of context_doc_ids.slice(0, 5)) {
            //         const docSnap = await docsColl.doc(id).get();
            //         if (docSnap.exists) {
            //             const data = docSnap.data();
            //             context.push({ doc_id: id, title: data.title || data.filename, snippet: data.summary || null });
            //             
            //             // Extract file paths for the first document (Python module handles one file at a time)
            //             if (!imagePath && !pdfPath) {
            //                 const storageUrl = data.storageUrl || '';
            //                 if (storageUrl.startsWith('file:')) {
            //                     const filePath = storageUrl.replace('file:', '');
            //                     const ext = path.extname(filePath).toLowerCase();
            //                     if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
            //                         imagePath = filePath;
            //                     } else if (ext === '.pdf') {
            //                         pdfPath = filePath;
            //                     }
            //                 }
            //             }
            //         }
            //     }
            // }
            
            // Support direct file paths from request body (for new uploads in chat)
            if (body.image_path) imagePath = body.image_path;
            if (body.pdf_path || body.file_path) pdfPath = body.pdf_path || body.file_path;

            // Debug: Log conversation state
            request.log.info('[chat] Conversation state:', {
                fullConversationLength: fullConversation.length,
                lastMessage: fullConversation[fullConversation.length - 1],
                hasMessages: fullConversation.length > 0
            });
            
            // create payload for AI microservice (send full conversation history for context)
            const payload = {
                user_id: userId,
                jurisdiction,
                domain,
                messages: fullConversation, // Full conversation history (previous Q&A + new user message)
                context,
                image_path: imagePath,
                pdf_path: pdfPath,
            };

            // call AI microservice (non-stream)
            const aiResp = await aiProxy.generate(payload); // expects { answer, sources, meta }
            
            // Debug: Log AI response
            request.log.info('[chat] AI proxy response:', {
                hasAnswer: !!aiResp.answer,
                hasText: !!aiResp.text,
                answerLength: aiResp.answer ? aiResp.answer.length : 0,
                error: aiResp.error
            });
            
            // Get AI response
            const assistantAnswer = aiResp.answer || aiResp.text || aiResp;
            
            // Append assistant response to conversation (like ChatGPT - each answer is part of conversation)
            const updatedConversation = [...fullConversation, {
                role: 'assistant',
                content: assistantAnswer
            }];
            
            // Use existing sessionId or create new one
            const finalSessionId = existingSessionId || uuidv4();
            
            // save/update session (if Firebase available - disabled for now)
            // if (fastify.firestore) {
            //     const sessionData = {
            //         sessionId: finalSessionId,
            //         userId,
            //         conversation: updatedConversation,
            //         sources: aiResp.sources || [],
            //         updatedAt: fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            //     };
            //     
            //     if (!existingSessionId) {
            //         sessionData.createdAt = fastify.firebaseAdmin.firestore.FieldValue.serverTimestamp();
            //     }
            //     
            //     await fastify.firestore.collection('sessions').doc(finalSessionId).set(sessionData, { merge: true });
            // }

            // Debug: Log the response before sending
            request.log.info('[chat] AI response received:', { 
                hasAnswer: !!assistantAnswer, 
                answerLength: assistantAnswer ? assistantAnswer.length : 0,
                sessionId: finalSessionId 
            });

            // Return response with answer and metadata
            return reply.send({ 
                status: 'ok', 
                data: { 
                    sessionId: finalSessionId,
                    answer: assistantAnswer, 
                    sources: aiResp.sources || [],
                    hasContext: !!(imagePath || pdfPath), // Indicate if document context was used
                    conversationLength: updatedConversation.length // Total messages in conversation
                } 
            });
        } catch (err) {
            request.log.error(err);
            const errorMessage = err.message || 'AI service error';
            return reply.code(502).send({ 
                status: 'error', 
                error: 'AI service error',
                details: errorMessage,
                // Include more details in development
                ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
            });
        }
    });
};
