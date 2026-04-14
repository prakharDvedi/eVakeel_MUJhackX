const axios = require("axios");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL ||
  process.env.GROQ_MODEL ||
  "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_API_URL =
  process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";

console.log("[aiProxy] Groq API key configured:", !!GROQ_API_KEY);
console.log("[aiProxy] Groq text model:", GROQ_MODEL);
console.log("[aiProxy] Groq vision model:", GROQ_VISION_MODEL);

function hasImageInput(imagePath) {
  return !!(imagePath && fs.existsSync(imagePath));
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".bmp") return "image/bmp";
  return "image/jpeg";
}

function imageFileToDataUrl(filePath) {
  const mimeType = getMimeType(filePath);
  const base64 = fs.readFileSync(filePath).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

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

function chunkText(text, maxChars = 12000) {
  if (!text) return "";
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

function normalizeMessages(messages = []) {
  return messages.map((msg) => ({
    role: msg.role === "assistant" ? "assistant" : "user",
    content: typeof msg.content === "string" ? msg.content : "",
  }));
}

async function createGroqCompletion(messages, options = {}) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const response = await axios.post(
    GROQ_API_URL,
    {
      model: options.model || GROQ_MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 1200,
    },
    {
      timeout: options.timeout || 30000,
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data?.choices?.[0]?.message?.content?.trim() || "";
}

async function generate(payload) {
  if (!GROQ_API_KEY) {
    return {
      answer: "Error: Groq API key not configured",
      text: "Error: Groq API key not configured",
      error: "GROQ_API_KEY not set",
      sources: [],
    };
  }

  try {
    const { messages = [], image_path, pdf_path } = payload;
    const normalizedMessages = normalizeMessages(messages);
    const systemPrompt =
      'You are a legal advisor in India. Provide clear, actionable legal steps in plain text only. Do not use markdown, bullet symbols, bold text, or asterisks. Be direct, professional, and factual. Explain practical risks, likely next steps, and what evidence or documents matter. Always end with "Risk Level: [number]/10".';

    let documentContext = "";
    if (pdf_path && fs.existsSync(pdf_path)) {
      console.log("[aiProxy.generate] Extracting text from PDF:", pdf_path);
      const extractedText = await extractTextFromPDF(pdf_path);
      if (extractedText) {
        documentContext = `Document context:\n${chunkText(extractedText)}\n\n`;
      }
    }

    const completionMessages = [{ role: "system", content: systemPrompt }];

    if (normalizedMessages.length === 0) {
      completionMessages.push({
        role: "user",
        content: `${documentContext}Provide legal guidance for the uploaded material.`,
      });
    } else {
      for (let i = 0; i < normalizedMessages.length; i += 1) {
        const message = normalizedMessages[i];
        const isLastUserMessage =
          i === normalizedMessages.length - 1 && message.role === "user";

        if (isLastUserMessage && (documentContext || hasImageInput(image_path))) {
          const content = [];
          const text = `${documentContext}${message.content}`.trim();
          if (text) {
            content.push({ type: "text", text });
          }
          if (hasImageInput(image_path)) {
            content.push({
              type: "image_url",
              image_url: {
                url: imageFileToDataUrl(image_path),
              },
            });
          }

          completionMessages.push({
            role: "user",
            content,
          });
        } else {
          completionMessages.push(message);
        }
      }
    }

    const model = hasImageInput(image_path) ? GROQ_VISION_MODEL : GROQ_MODEL;
    const answer = await createGroqCompletion(completionMessages, {
      model,
      temperature: 0.4,
      max_tokens: 1200,
    });

    return {
      answer,
      text: answer,
      sources: [],
      model,
    };
  } catch (error) {
    console.error("[aiProxy.generate] Groq API error:", error.message);

    return {
      answer: `Error: ${error.message}`,
      text: `Error: ${error.message}`,
      error: error.message,
      sources: [],
    };
  }
}

function inferClassification(text) {
  const lower = (text || "").toLowerCase();
  if (
    lower.includes("scam") ||
    lower.includes("fraud") ||
    lower.includes("forged")
  ) {
    return "suspicious";
  }
  if (
    lower.includes("appears valid") ||
    lower.includes("legally valid") ||
    lower.includes("lawful")
  ) {
    return "legal";
  }
  return "unclear";
}

function extractRiskLevel(text) {
  const match = (text || "").match(/risk level:\s*(\d{1,2})\/10/i);
  return match ? Number(match[1]) : null;
}

async function analyzeDocument(payload, timeout) {
  const { input_text, image_path, pdf_path } = payload;
  let extractedText = null;

  if (pdf_path && fs.existsSync(pdf_path)) {
    console.log("[aiProxy.callAI] Extracting text from PDF:", pdf_path);
    extractedText = await extractTextFromPDF(pdf_path);
  }

  if (!extractedText && !hasImageInput(image_path)) {
    return {
      error:
        "Could not extract text from document. File not found or format not supported.",
    };
  }

  const userInstruction =
    input_text ||
    "Is this document legal? What are the key points and any red flags?";
  const content = [];
  let prompt =
    `Analyze this legal document.\n\nQuestion: ${userInstruction}\n\n` +
    "Respond in plain text with these sections exactly: Summary, Key points, Potential risks or red flags, Classification, Actionable legal steps, Risk Level.\n";

  if (extractedText) {
    prompt += `\nDocument text:\n${chunkText(extractedText)}\n`;
  }

  content.push({ type: "text", text: prompt });

  if (hasImageInput(image_path)) {
    content.push({
      type: "image_url",
      image_url: {
        url: imageFileToDataUrl(image_path),
      },
    });
  }

  const model = hasImageInput(image_path) ? GROQ_VISION_MODEL : GROQ_MODEL;
  const analysisText = await createGroqCompletion(
    [
      {
        role: "system",
        content:
          'You are a legal document analyst for India. Be precise, practical, and plain-text only. Always end with "Risk Level: [number]/10".',
      },
      {
        role: "user",
        content,
      },
    ],
    {
      model,
      timeout,
      temperature: 0.2,
      max_tokens: 1400,
    }
  );

  return {
    summary: analysisText.substring(0, 500),
    full_analysis: analysisText,
    classification: inferClassification(analysisText),
    key_points: [],
    risks: [],
    confidence: 0.8,
    risk_level: extractRiskLevel(analysisText),
  };
}

async function callAI(route, payload, timeout = 30000) {
  if (!GROQ_API_KEY) {
    return { error: "Groq API key not configured" };
  }

  try {
    if (route === "analyze") {
      return await analyzeDocument(payload, timeout);
    }

    if (route === "retrieve") {
      const { query, top_k = 5, domain = null } = payload;
      const answer = await createGroqCompletion(
        [
          {
            role: "system",
            content:
              "You are a legal research assistant for India. Provide concise research guidance, likely applicable legal areas, useful keywords, and cautionary notes in plain text.",
          },
          {
            role: "user",
            content:
              `User query: ${query}\n` +
              `Requested result count: ${top_k}\n` +
              `Domain filter: ${domain || "all"}\n\n` +
              "Return a compact research note with likely statutes, relevant authorities, search keywords, and a short next-step recommendation.",
          },
        ],
        { timeout, temperature: 0.2, max_tokens: 900 }
      );

      return {
        query,
        domain,
        top_k,
        answer,
        suggestions: [],
      };
    }

    if (route === "incidents/advise") {
      const { incident_type, description, jurisdiction = "india" } = payload;
      const advice = await createGroqCompletion(
        [
          {
            role: "system",
            content:
              'You are a legal incident response advisor for India. Provide immediate practical steps, evidence preservation advice, escalation options, and risk assessment in plain text only. Always end with "Risk Level: [number]/10".',
          },
          {
            role: "user",
            content:
              `Jurisdiction: ${jurisdiction}\n` +
              `Incident type: ${incident_type}\n` +
              `Description: ${description}\n\n` +
              "Advise on immediate next steps, reporting options, documents to keep, and likely legal exposure.",
          },
        ],
        { timeout, temperature: 0.3, max_tokens: 1100 }
      );

      return {
        answer: advice,
        advice,
        risk_level: extractRiskLevel(advice),
      };
    }

    if (route === "generate-template") {
      const { template_type, inputs = {}, language = "en", tone = "formal" } =
        payload;
      const preview = await createGroqCompletion(
        [
          {
            role: "system",
            content:
              "You draft legal templates for India. Produce clean plain text suitable for direct editing. Do not use markdown.",
          },
          {
            role: "user",
            content:
              `Template type: ${template_type}\n` +
              `Language: ${language}\n` +
              `Tone: ${tone}\n` +
              `Inputs: ${JSON.stringify(inputs)}\n\n` +
              "Draft the requested template with placeholders only where information is missing.",
          },
        ],
        { timeout, temperature: 0.2, max_tokens: 1500 }
      );

      return {
        document_url: null,
        preview,
      };
    }

    if (route === "admin/ingest") {
      return {
        status: "accepted",
        message:
          "Corpus ingest is not implemented as a separate pipeline in this backend. Groq is now active for runtime AI requests.",
        corpusUrl: payload.corpusUrl,
      };
    }

    if (route === "admin/rebuild-index") {
      return {
        status: "noop",
        message:
          "No local search index is configured. Runtime responses are generated directly through Groq.",
      };
    }

    if (route === "admin/metrics") {
      return {
        provider: "groq",
        model: GROQ_MODEL,
        vision_model: GROQ_VISION_MODEL,
        api_configured: true,
      };
    }

    return { error: `Unsupported path: ${route}` };
  } catch (error) {
    console.error("[aiProxy.callAI] Error:", error.message);
    return { error: error.message };
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
  } else if (ws && ws.readyState === 1) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: result.error || "Unknown error",
      })
    );
  }
}

module.exports = { generate, callAI, streamToClient };
