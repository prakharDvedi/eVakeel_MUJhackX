const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
// Config removed - using environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

console.log("[aiProxy] Config loaded - API key exists:", !!GEMINI_API_KEY);
console.log("[aiProxy] Model:", GEMINI_MODEL);

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: GEMINI_MODEL }) : null;

console.log("[aiProxy] Gemini client ready:", !!model);

//extract tect from pdf file
async function extractTextFromPDF(pdfPath) {
  try {
    if (!fs.existsSync(pdfPath)) {
      console.error("[aiProxy] PDF file not found:", pdfPath);
      return null;
    }
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("[aiProxy] PDF extraction error:", error.message);
    return null;
  }
}

async function generate(payload) {
  if (!model) {
    return {
      answer: "Error: Gemini API key not configured",
      text: "Error: Gemini API key not configured",
      error: "GEMINI_API_KEY not set",
      sources: [],
    };
  }

  try {
    const { messages, image_path, pdf_path } = payload;

    let extractedText = null;
    if (pdf_path && fs.existsSync(pdf_path)) {
      console.log("[aiProxy.generate] Extracting text from PDF:", pdf_path);
      extractedText = await extractTextFromPDF(pdf_path);
      if (extractedText) {  
        console.log(
          "[aiProxy.generate] Extracted",
          extractedText.length,
          "characters from PDF"
        );
      }
    }

    const systemPrompt = `You are a legal advisor in india and giving answer as per indian advocate. Provide clear, actionable legal steps without markdown formatting (no bold text, no asterisks). Use plain text format. Do not console or reassure the user - be professional, direct, and factual. Focus on providing proper legal actionable steps and explain the risks involved in the case. Keep answers concise when possible, but provide detailed explanation when necessary.for sure Always end your response with a line that rates the risk level on a scale of 1-10, formatted as: "Risk Level: [number]/10".`;

    const history = [];
    let lastUserMessage = "";

    for (let i = 0; i < (messages || []).length - 1; i++) {
      const msg = messages[i];
      const role = msg.role === "assistant" ? "model" : "user";
      history.push({
        role: role,
        parts: [{ text: msg.content || "" }],
      });
    }

    if (messages && messages.length > 0) {
      lastUserMessage = messages[messages.length - 1].content || "";
    }
    let finalPrompt = `${systemPrompt}\n\n`;
    if (extractedText) {
      finalPrompt += `Here is additional context from a document:\n\n${extractedText.substring(
        0,
        10000
      )}\n\n`;
    }
    finalPrompt += `User Query: ${lastUserMessage}`;

    console.log("[aiProxy.generate] Calling Gemini API");

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(finalPrompt);
    const response = result.response;
    const answer = response.text();

    console.log("[aiProxy.generate] Answer length:", answer.length);

    return {
      answer: answer,
      text: answer,
      sources: [],
      model: GEMINI_MODEL,
    };
  } catch (error) {
    console.error("[aiProxy.generate] Gemini API error:", error.message);

    let errorMessage = error.message;
    if (errorMessage.includes("API key")) {
      errorMessage =
        "Invalid Gemini API key. Please check your API key in Backend/.env file.";
    }

    return {
      answer: `Error: ${errorMessage}`,
      text: `Error: ${errorMessage}`,
      error: errorMessage,
      sources: [],
    };
  }
}

async function callAI(path, payload, timeout = 30000) {
  if (!model) {
    return { error: "Gemini API key not configured" };
  }

  if (path === "analyze") {
    try {
      const { input_text, image_path, pdf_path } = payload;

      // Extract text from document
      let extractedText = null;
      if (pdf_path && fs.existsSync(pdf_path)) {
        console.log("[aiProxy.callAI] Extracting text from PDF:", pdf_path);
        extractedText = await extractTextFromPDF(pdf_path);
      }

      if (!extractedText) {
        return {
          error:
            "Could not extract text from document. File not found or format not supported.",
        };
      }

      const analysisPrompt = `Analyze this legal document and answer the following question:

Question: ${
        input_text ||
        "Is this document legal? What are the key points and any red flags?"
      }

Document Text:
${extractedText.substring(0, 10000)}

Provide a structured analysis with:
1. Summary
2. Key points
3. Potential risks or red flags
4. Classification (legal/suspicious/scam/unclear)
5. Actionable legal steps (if applicable)

Use plain text format only - no markdown formatting, no bold text, no asterisks. Be professional and direct without consoling the user. Always end with a risk rating on a scale of 1-10 as: "Risk Level: [number]/10".`;

      console.log("[aiProxy.callAI] Calling Gemini API for document analysis");

      const result = await model.generateContent(analysisPrompt);
      const response = result.response;
      const analysisText = response.text();

      return {
        summary: analysisText.substring(0, 500),
        full_analysis: analysisText,
        classification: "unclear",
        key_points: [],
        risks: [],
        confidence: 0.8,
      };
    } catch (error) {
      console.error("[aiProxy.callAI] Analysis error:", error.message);
      return { error: `Analysis error: ${error.message}` };
    }
  } else {
    // For other paths, return error
    return { error: `Unsupported path: ${path}` };
  }
}

async function streamToClient(aiStreamPath, initPayload, ws, opts = {}) {
  const result = await generate(initPayload);
  if (result.answer) {
    const chunks = result.answer.match(/.{1,50}/g) || [result.answer];
    for (const chunk of chunks) {
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "token", data: chunk }));
      }
    }
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: "done" }));
    }
  } else {
    if (ws && ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: result.error || "Unknown error",
        })
      );
    }
  }
}

module.exports = { generate, callAI, streamToClient };
