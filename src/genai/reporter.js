/**
 * src/genai/reporter.js
 *
 * Purpose:
 *  - Handle the full lifecycle of Gemini analysis results.
 *  - Take the raw output from analyzeEndpoint(),
 *  - Clean and normalize it using adapter.js,
 *  - Save it as a timestamped report file under src/ai_reports/.
 *
 * Usage Example:
 *  import { generateGeminiReport } from "../genai/reporter.js";
 *
 *  const aiResponse = await analyzeEndpoint(payload);
 *  await generateGeminiReport(payload, aiResponse.raw);
 */

import fs from "fs";
import path from "path";
import { cleanGeminiResponse, printAnalysisResult } from "./adapter.js";

/**
 * Main helper to generate and store AI analysis report
 * @param {Object} payload - Endpoint metadata (includes endpoint info)
 * @param {string} rawResponse - Raw string output from Gemini API
 */
export async function generateGeminiReport(payload, rawResponse) {
  if (!payload || !rawResponse) {
    console.error("❌ Missing payload or Gemini response.");
    return;
  }

  console.log(`\n🧠 Generating Gemini AI report for endpoint: ${payload.endpoint?.handler || "unknown"} ...`);

  try {
    // 1️⃣ Clean and parse AI response
    const cleaned = cleanGeminiResponse(rawResponse);

    // 2️⃣ Print clean summary in terminal
    printAnalysisResult(cleaned);

    // 3️⃣ Build folder and filename for saving
    const outputDir = path.resolve("src/ai_reports");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${payload.endpoint?.handler || "endpoint"}_AI_Insights_${timestamp}.json`;
    const outputPath = path.join(outputDir, fileName);

    // 4️⃣ Save report
    fs.writeFileSync(outputPath, JSON.stringify(cleaned, null, 2), "utf8");
    console.log(`💾 Gemini AI report saved to: ${outputPath}\n`);
  } catch (err) {
    console.error(`❌ Failed to generate AI report:`, err.message);
  }
}

