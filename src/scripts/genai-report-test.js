/**
 * src/scripts/genai-report-test.js
 *
 * ✅ Full test runner for the AI Code Optimizer pipeline.
 * Flow:
 * 1️⃣ Build endpoint payload
 * 2️⃣ Send to Gemini using analyzeEndpoint()
 * 3️⃣ Clean & parse response using adapter
 * 4️⃣ Save cleaned report using reporter
 */

import { analyzeEndpoint } from "../genai/client.js";
import { cleanGeminiResponse, printAnalysisResult } from "../genai/adapter.js";
import { generateGeminiReport } from "../genai/reporter.js";

// Step 1️⃣: Create sample payload for testing
const testPayload = {
  endpoint: { method: "GET", path: "/", handler: "getUsers" },
  function: {
    name: "getUsers",
    sanitizedCode: `async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}`,
    async: true,
    lines: 8,
  },
  metadata: { project: "AI Code Reviewer", environment: "local" },
  timestamp: Date.now(),
};

// Step 2️⃣: Run complete pipeline
async function runPipeline() {
  console.log("🚀 Sending sanitized payload to Gemini for analysis...");

  try {
    // 1. Send to Gemini
    const result = await analyzeEndpoint(testPayload);

    // 2. Clean + parse Gemini response
    const cleaned = cleanGeminiResponse(result.raw);

    // 3. Pretty-print result in console
    printAnalysisResult(cleaned);

    // 4. Save report to /src/ai_reports
    await generateGeminiReport(testPayload, result.raw);

    console.log("✅ Full pipeline complete: Gemini → Clean → Report Saved.");
  } catch (err) {
    console.error("❌ Pipeline failed:", err.message);
  }
}

runPipeline();
