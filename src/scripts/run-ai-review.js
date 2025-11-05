/**
 * src/scripts/run-ai-review.js
 *
 * Purpose:
 *  - Load sanitized endpoint analysis payloads from /analysis_reports
 *  - Send each payload to Gemini via genai/client.js
 *  - Clean and format Gemini output using genai/adapter.js
 *  - Save AI insights to /ai_reports and print summary to terminal
 *
 * Usage:
 *   node src/scripts/run-ai-review.js
 */

import fs from "fs";
import path from "path";
import { analyzeEndpoint } from "../genai/client.js";
import { cleanGeminiResponse, printAnalysisResult } from "../genai/adapter.js";

// Directory constants
const ANALYSIS_DIR = path.resolve("src/analysis_reports");
const AI_REPORTS_DIR = path.resolve("src/ai_reports");

/**
 * Load all serialized analyzer payloads.
 * These are the .json files created by your core analyzer.
 */
function loadAnalyzerPayloads() {
  if (!fs.existsSync(ANALYSIS_DIR)) {
    console.error(`❌ No analyzer output folder found at: ${ANALYSIS_DIR}`);
    return [];
  }

  const files = fs.readdirSync(ANALYSIS_DIR).filter((f) => f.endsWith(".json"));
  if (!files.length) {
    console.warn("⚠️ No analyzer payloads found. Run your analyzer first.");
    return [];
  }

  console.log(`📂 Found ${files.length} analyzer payloads:\n - ${files.join("\n - ")}`);

  const payloads = files.map((file) => {
    const content = fs.readFileSync(path.join(ANALYSIS_DIR, file), "utf8");
    try {
      return JSON.parse(content);
    } catch {
      console.warn(`⚠️ Skipping invalid JSON: ${file}`);
      return null;
    }
  });

  return payloads.filter(Boolean);
}

/**
 * Send payload to Gemini → parse → save results
 */
async function processPayloadWithGemini(payload) {
  console.log(`\n🚀 Sending endpoint "${payload.endpoint?.handler}" to Gemini...`);

  try {
    const aiResponse = await analyzeEndpoint(payload, { retries: 2 });
    const cleaned = cleanGeminiResponse(aiResponse.raw);

    // Pretty-print for terminal output
    printAnalysisResult(cleaned);

    // Save the cleaned output
    if (!fs.existsSync(AI_REPORTS_DIR)) fs.mkdirSync(AI_REPORTS_DIR, { recursive: true });
    const filename = `${payload.endpoint?.handler || "endpoint"}_AI_${Date.now()}.json`;
    const outPath = path.join(AI_REPORTS_DIR, filename);

    fs.writeFileSync(outPath, JSON.stringify(cleaned, null, 2), "utf8");
    console.log(`💾 AI Report saved to: ${outPath}`);
  } catch (err) {
    console.error(`❌ Failed to analyze ${payload.endpoint?.handler}:`, err.message || err);
  }
}

/**
 * Main entry
 */
async function runAIReview() {
  console.log("──────────────────────────────────────────────");
  console.log("🧠 Starting AI-Powered Code Review via Gemini");
  console.log("──────────────────────────────────────────────");

  const payloads = loadAnalyzerPayloads();
  if (!payloads.length) return;

  for (const payload of payloads) {
    await processPayloadWithGemini(payload);
  }

  console.log("\n✅ AI Code Review complete. Reports saved in /src/ai_reports.");
  console.log("──────────────────────────────────────────────");
}

// Run
runAIReview();
