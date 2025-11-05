/**
 * src/scripts/local-test.js
 *
 * Simulates Gemini response processing *without* using API tokens.
 * Reads a local mock response → cleans → parses → saves report.
 */

import fs from "fs";
import path from "path";
import { cleanGeminiResponse, printAnalysisResult } from "../genai/adapter.js";
import { generateGeminiReport } from "../genai/reporter.js";

const __dirname = path.resolve();

async function runLocalTest() {
  console.log("🧪 Running local Gemini response test (no API calls)...");

  // 1️⃣ Load mock Gemini response
  const mockPath = path.join(__dirname, "src", "mock_data", "sample_gemini_response.json");
  const rawResponse = fs.readFileSync(mockPath, "utf8");

  // 2️⃣ Clean + parse using adapter
  const cleaned = cleanGeminiResponse(rawResponse);

  // 3️⃣ Print analysis summary
  printAnalysisResult(cleaned);

  // 4️⃣ Simulate payload for report
  const fakePayload = {
    endpoint: { method: "GET", path: "/", handler: "getUsers" },
    function: { name: "getUsers" },
    metadata: { project: "AI Code Reviewer", source: "local-test" },
    timestamp: Date.now(),
  };

  // 5️⃣ Save report locally
  await generateGeminiReport(fakePayload, rawResponse);

  console.log("✅ Local test complete. No API tokens used.");
}

runLocalTest();
