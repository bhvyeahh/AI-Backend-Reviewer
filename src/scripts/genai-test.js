import { analyzeEndpoint } from "../genai/client.js";
import fs from "fs";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// change this to match your actual report filename
const reportFile = path.join(__dirname, "../../analysis_reports/getUsers_1762260982749.json");

// Load your analyzer's JSON output
const payload = JSON.parse(fs.readFileSync(reportFile, "utf8"));

console.log("🚀 Sending sanitized payload to Gemini for analysis...\n");

try {
  const result = await analyzeEndpoint(payload);

  console.log("✅ Gemini Response Received!\n");

  if (result.parsed) {
    console.log("📊 Parsed JSON Output:\n", JSON.stringify(result.parsed, null, 2));
  } else {
    console.log("📝 Raw Response (Not Parsed):\n", result.raw);
  }

} catch (err) {
  console.error("❌ Gemini Analysis Failed:");
  console.error(err.message || err);
}
