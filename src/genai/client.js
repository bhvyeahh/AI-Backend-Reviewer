/**
 * src/genai/client.js
 *
 * Gemini (Google GenAI) client wrapper for the AI-Powered Code Optimizer.
 *
 * Responsibilities:
 *  - Initialize the GenAI client using an API key from env
 *  - Provide analyzeEndpoint(payload) that sends sanitized code+metadata
 *    and returns model suggestions
 *  - Provide a small retry/backoff wrapper so transient errors are handled
 *
 * Usage:
 *   import { analyzeEndpoint, setModel } from './src/genai/client.js';
 *   const suggestions = await analyzeEndpoint(payload);
 *
 * Notes:
 *  - Install: npm install @google/genai dotenv p-retry
 *  - Ensure process.env.GEMINI_API_KEY is set
 */

import dotenv from "dotenv";
dotenv.config();

import pRetry from "p-retry";

let genaiClient = null;
let DEFAULT_MODEL = process.env.GEMINI_DEFAULT_MODEL || "gemini-2.5-flash";

try {
  // Initialize Google GenAI SDK
  const { GoogleGenAI } = await import("@google/genai");

  genaiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
} catch (err) {
  console.error(
    "Failed to load @google/genai. Make sure you ran: npm install @google/genai\n",
    err.message || err
  );
  genaiClient = null;
}

/**
 * Build a concise prompt for analysis.
 * @param {Object} payload - { endpoint, function, metadata, timestamp }
 * @returns {string} prompt
 */
function buildAnalysisPrompt(payload) {
  const ep = payload.endpoint || {};
  const fn = payload.function || {};
  const meta = payload.metadata || {};

  return [
    `You are an expert Node.js/Express backend engineer focused on performance and scalability.`,
    `Analyze the following Express API endpoint and provide:`,
    `  1) A short summary of what it does (1-2 lines).`,
    `  2) Performance issues and why they are problems (bulleted).`,
    `  3) Concrete optimizations (code-level suggestions) with explanation.`,
    `  4) Estimated difficulty (low/medium/high) and estimated impact (low/medium/high).`,
    `  5) If safe, provide a concise "before -> after" pseudo-code snippet illustrating the change.`,
    ``,
    `CONSTRAINTS:`,
    ` - Reply in JSON with keys: summary, issues (array), suggestions (array), before_after (string|null), notes.`,
    ` - Do not include secrets or PII; assume code is sanitized.`,
    ` - Keep each suggestion short and actionable.`,
    ``,
    `ENDPOINT METADATA:`,
    `Method: ${ep.method || "UNKNOWN"}, Path: ${ep.path || "UNKNOWN"}, Handler: ${ep.handler || "UNKNOWN"}`,
    `Function name: ${fn.name || "unknown"}, async: ${fn.async}, lines: ${fn.lines}`,
    `Extra metadata: ${JSON.stringify(meta)}`,
    ``,
    `SANITIZED CODE (analyze this):`,
    "```js",
    fn.sanitizedCode || fn.cleanedCode || "// no code provided",
    "```",
    ``,
    `Return ONLY valid JSON. Don't add commentary outside JSON.`,
  ].join("\n");
}

/**
 * Calls Gemini API and returns model output text.
 */
async function generateTextWithGenAI(model, prompt) {
  if (!genaiClient) {
    throw new Error(
      "GenAI client not initialized. Install @google/genai and set GEMINI_API_KEY in .env"
    );
  }

  // Proper request body per @google/genai spec
  const request = {
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1200,
      topP: 0.9,
      topK: 40,
    },
  };

  try {
    // Modern SDK method
    if (
      genaiClient.models &&
      typeof genaiClient.models.generateContent === "function"
    ) {
      const resp = await genaiClient.models.generateContent(request);
      const text =
        resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        resp?.response?.text ||
        JSON.stringify(resp);
      return text;
    }

    // Older SDK fallback
    if (typeof genaiClient.generateContent === "function") {
      const resp = await genaiClient.generateContent(request);
      const text =
        resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        resp?.response?.text ||
        JSON.stringify(resp);
      return text;
    }

    throw new Error(
      "GenAI SDK found but does not expose generateContent(). Check your @google/genai version."
    );
  } catch (err) {
    console.error("❌ Error calling Gemini:", err.message || err);
    throw err;
  }
}

/**
 * analyzeEndpoint(payload)
 * - Builds prompt from sanitized endpoint payload
 * - Sends it to Gemini
 * - Parses JSON response
 * - Returns structured result
 */
export async function analyzeEndpoint(payload, opts = {}) {
  if (!payload || !payload.function) {
    throw new Error(
      "analyzeEndpoint expects a payload with payload.function.cleanedCode/sanitizedCode"
    );
  }

  const model = opts.model || DEFAULT_MODEL;
  const prompt = buildAnalysisPrompt(payload);

  const run = async () => {
    const raw = await generateTextWithGenAI(model, prompt);

    let parsed = null;
    try {
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const jsonText = raw.slice(firstBrace, lastBrace + 1);
        parsed = JSON.parse(jsonText);
      } else {
        parsed = JSON.parse(raw);
      }
    } catch {
      parsed = null;
    }

    return { raw, parsed };
  };

  const retries = opts.retries ?? 3;

  const result = await pRetry(run, {
    retries,
    onFailedAttempt: (err) => {
      console.warn("GenAI attempt failed:", err.message || err);
    },
  });

  return result;
}

/**
 * Allows switching models dynamically.
 */
export function setModel(modelId) {
  DEFAULT_MODEL = modelId;
}

export default {
  analyzeEndpoint,
  setModel,
};
