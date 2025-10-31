// services/aiProxy.js
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const config = require('../config');

// Load OpenAI API key from config
const OPENAI_API_KEY = config.openai.apiKey;
const OPENAI_MODEL = config.openai.model;

// Debug: Check API key loading
console.log('[aiProxy] Config loaded - API key exists:', !!OPENAI_API_KEY);
console.log('[aiProxy] API key length:', OPENAI_API_KEY ? OPENAI_API_KEY.length : 0);
console.log('[aiProxy] Model:', OPENAI_MODEL);

// Initialize OpenAI client
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

console.log('[aiProxy] Initialized with model:', OPENAI_MODEL);
console.log('[aiProxy] OpenAI client ready:', !!client);

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(pdfPath) {
    try {
        if (!fs.existsSync(pdfPath)) {
            console.error('[aiProxy] PDF file not found:', pdfPath);
            return null;
        }
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('[aiProxy] PDF extraction error:', error.message);
        return null;
    }
}

/**
 * Chat with OpenAI (with optional PDF/image context)
 */
async function generate(payload) {
    if (!client) {
        return {
            answer: 'Error: OpenAI API key not configured',
            text: 'Error: OpenAI API key not configured',
            error: 'OPENAI_API_KEY not set',
            sources: []
        };
    }

    try {
        const { messages, image_path, pdf_path } = payload;
        
        // Extract text from PDF if provided
        let extractedText = null;
        if (pdf_path && fs.existsSync(pdf_path)) {
            console.log('[aiProxy.generate] Extracting text from PDF:', pdf_path);
            extractedText = await extractTextFromPDF(pdf_path);
            if (extractedText) {
                console.log('[aiProxy.generate] Extracted', extractedText.length, 'characters from PDF');
            }
        }
        
        // Prepare messages for OpenAI
        const openaiMessages = [];
        for (const msg of (messages || [])) {
            openaiMessages.push({
                role: msg.role || 'user',
                content: msg.content || ''
            });
        }
        
        // Add extracted text as context if available
        if (extractedText) {
            const contextMsg = `Here is additional context from a document:\n\n${extractedText.substring(0, 4000)}`;
            if (openaiMessages.length > 0 && openaiMessages[openaiMessages.length - 1].role === 'user') {
                openaiMessages[openaiMessages.length - 1].content += `\n\n${contextMsg}`;
            } else {
                openaiMessages.unshift({ role: 'system', content: contextMsg });
            }
        }
        
        // Call OpenAI API
        console.log('[aiProxy.generate] Calling OpenAI API with', openaiMessages.length, 'messages');
        console.log('[aiProxy.generate] First message preview:', openaiMessages[0]?.content?.substring(0, 100));
        
        const response = await client.chat.completions.create({
            model: OPENAI_MODEL,
            messages: openaiMessages,
            temperature: 0.7,
            max_tokens: 1500
        });
        
        console.log('[aiProxy.generate] OpenAI response received:', {
            hasChoices: !!response.choices,
            choicesLength: response.choices?.length || 0,
            finishReason: response.choices?.[0]?.finish_reason
        });
        
        const answer = response.choices[0]?.message?.content;
        
        if (!answer) {
            console.error('[aiProxy.generate] No answer in response:', JSON.stringify(response, null, 2));
            return {
                answer: 'Error: No response from OpenAI',
                text: 'Error: No response from OpenAI',
                error: 'Empty response from OpenAI',
                sources: []
            };
        }
        
        console.log('[aiProxy.generate] Answer length:', answer.length);
        
        return {
            answer: answer,
            text: answer,
            sources: [],
            model: OPENAI_MODEL
        };
    } catch (error) {
        console.error('[aiProxy.generate] OpenAI API error:', error.message);
        
        // Provide more helpful error messages
        let errorMessage = error.message;
        if (error.status === 401 || error.message.includes('Incorrect API key') || error.message.includes('Invalid API key')) {
            errorMessage = 'Invalid OpenAI API key. Please check your API key in Backend/config.js. Make sure it\'s the correct key from https://platform.openai.com/account/api-keys';
            console.error('[aiProxy.generate] API KEY ERROR - Check config.js and verify your API key is valid');
        } else if (error.status === 429) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (error.status === 500 || error.status === 502) {
            errorMessage = 'OpenAI service is temporarily unavailable. Please try again later.';
        }
        
        return {
            answer: `Error: ${errorMessage}`,
            text: `Error: ${errorMessage}`,
            error: errorMessage,
            sources: []
        };
    }
}

/**
 * Analyze document (PDF or image)
 */
async function callAI(path, payload, timeout = 30000) {
    if (!client) {
        return { error: 'OpenAI API key not configured' };
    }

    if (path === 'analyze') {
        try {
            const { input_text, image_path, pdf_path } = payload;
            
            // Extract text from document
            let extractedText = null;
            if (pdf_path && fs.existsSync(pdf_path)) {
                console.log('[aiProxy.callAI] Extracting text from PDF:', pdf_path);
                extractedText = await extractTextFromPDF(pdf_path);
            }
            // TODO: Add image OCR support if needed
            
            if (!extractedText) {
                return { error: 'Could not extract text from document. File not found or format not supported.' };
            }
            
            // Prepare analysis prompt
            const analysisPrompt = `Analyze this legal document and answer the following question:

Question: ${input_text || 'Is this document legal? What are the key points and any red flags?'}

Document Text:
${extractedText.substring(0, 6000)}

Provide a structured analysis with:
1. Summary
2. Key points
3. Potential risks or red flags
4. Classification (legal/suspicious/scam/unclear)`;
            
            console.log('[aiProxy.callAI] Calling OpenAI API for document analysis');
            const response = await client.chat.completions.create({
                model: OPENAI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a legal document analyst. Provide clear, structured analysis of legal documents.'
                    },
                    {
                        role: 'user',
                        content: analysisPrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            });
            
            const analysisText = response.choices[0].message.content;
            
            // Parse response into structured format
            return {
                summary: analysisText.substring(0, 500),
                full_analysis: analysisText,
                classification: 'unclear', // Could parse from response
                key_points: [],
                risks: [],
                confidence: 0.8
            };
        } catch (error) {
            console.error('[aiProxy.callAI] Analysis error:', error.message);
            return { error: `Analysis error: ${error.message}` };
        }
    } else {
        // For other paths, return error
        return { error: `Unsupported path: ${path}` };
    }
}

/**
 * Stream tokens from AI service to the client websocket.
 * Note: This is a simplified version - you can enhance it with OpenAI streaming later
 */
async function streamToClient(aiStreamPath, initPayload, ws, opts = {}) {
    // For now, just call generate and stream the response
    // You can implement OpenAI streaming API here later
    const result = await generate(initPayload);
    if (result.answer) {
        // Simulate streaming by sending chunks
        const chunks = result.answer.match(/.{1,50}/g) || [result.answer];
        for (const chunk of chunks) {
            if (ws && ws.readyState === 1) {
                ws.send(JSON.stringify({ type: 'token', data: chunk }));
            }
        }
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'done' }));
        }
    } else {
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'error', message: result.error || 'Unknown error' }));
        }
    }
}

module.exports = { generate, callAI, streamToClient };
