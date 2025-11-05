/**
 * ---------------------------------------------------------
 *  Full AI Analysis Pipeline
 * ---------------------------------------------------------
 *  Flow:
 *   1. User selects router file
 *   2. Analyzer runs for that file (with endpoint selection)
 *   3. Gemini AI analyzes new payloads in analysis_reports/
 * ---------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import inquirer from "inquirer";
import { analyzeEndpoint } from "../genai/client.js";
import { cleanGeminiResponse } from "../genai/adapter.js";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTES_DIR = path.join(__dirname, "../..", "src", "routes");
const ANALYSIS_DIR = path.join(__dirname, "../..", "analysis_reports");
const AI_REPORTS_DIR = path.join(__dirname, "../..", "src", "ai_reports");

if (!fs.existsSync(AI_REPORTS_DIR)) fs.mkdirSync(AI_REPORTS_DIR, { recursive: true });

/**
 * Step 1: Ask which route to analyze
 */
async function selectRouteFile() {
  const files = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith(".js"));
  if (files.length === 0) {
    console.error("⚠️ No route files found in src/routes/");
    process.exit(1);
  }

  const { selectedFile } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedFile",
      message: "📁 Select which route file to analyze:",
      choices: files,
    },
  ]);

  return selectedFile;
}

/**
 * Step 2: Run analyzer for selected route
 */
function runAnalyzer(selectedFile) {
  console.log(`\n🚀 Running Analyzer for ${selectedFile}...\n`);
  try {
    execSync(`node src/analyzer/index.js ${selectedFile}`, { stdio: "inherit" });
  } catch (err) {
    console.error("❌ Analyzer failed:", err.message);
    process.exit(1);
  }
}

/**
 * Step 3: Send new payloads to Gemini
 */
async function analyzeReports() {
  console.log("\n📂 Scanning analyzer output files...\n");

  const payloadFiles = fs
    .readdirSync(ANALYSIS_DIR)
    .filter(f => f.endsWith(".json") && !f.includes("last_session"));

  if (payloadFiles.length === 0) {
    console.warn("⚠️ No payloads found in analysis_reports/");
    return;
  }

  for (const file of payloadFiles) {
    const payloadPath = path.join(ANALYSIS_DIR, file);
    const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
    const endpointName = payload.function?.name || "unknown";

    if (!payload.function?.cleanedCode && !payload.function?.sanitizedCode) {
      console.warn(`⚠️ Skipping ${file}: invalid payload structure.`);
      continue;
    }

    console.log(`🧠 Analyzing endpoint: ${endpointName} (${file})`);
    console.log("──────────────────────────────");

    try {
      const aiResult = await analyzeEndpoint(payload);
      const cleaned = cleanGeminiResponse(aiResult.raw || aiResult);

      const reportName = `${endpointName}_AI_Insights_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;
      const reportPath = path.join(AI_REPORTS_DIR, reportName);

      fs.writeFileSync(reportPath, JSON.stringify(cleaned, null, 2));
      console.log(`✅ Saved Gemini report → ${reportPath}\n`);
    } catch (err) {
      console.error(`❌ Error analyzing ${file}:`, err.message);
    }
  }

  console.log("🎉 All selected endpoints analyzed successfully!\n");
}

/**
 * Step 4: Orchestrate everything
 */
/**
 * Step 4: Orchestrate everything
 */
async function runFullPipeline() {
  const selectedFile = await selectRouteFile();

  // 🧹 Clean up old payloads so only fresh ones get analyzed
  if (fs.existsSync(ANALYSIS_DIR)) {
    fs.rmSync(ANALYSIS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(ANALYSIS_DIR, { recursive: true });

  runAnalyzer(selectedFile);
  await analyzeReports();
}

runFullPipeline();
