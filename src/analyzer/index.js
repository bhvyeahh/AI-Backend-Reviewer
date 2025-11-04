/**
 * ---------------------------------------------------------
 *  AI-Powered Code Optimizer - Analyzer Orchestrator
 * ---------------------------------------------------------
 *  This is the entry point for the Analyzer module.
 *  It’s responsible for:
 *    1. Discovering route files (via route-reflector)
 *    2. Parsing each file (via ast-parser)
 *    3. Extracting logic blocks (via logic-extractor)
 *    4. Cleaning (via sanitizer)
 *    5. Serializing (via serializer)
 *
 *  For now, this file will just:
 *    - Verify imports
 *    - Log initialization flow
 *    - Read all route files (next step)
 *
 *  Author: Bhavya Rathore
 *  Date: 2025
 * ---------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import url from "url";

/* -------------------------------------------------------
 * Helper: Resolve directory (for ES module __dirname)
 * ----------------------------------------------------- */
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------------------------------------
 * Placeholder imports (we’ll implement these later)
 * ----------------------------------------------------- */
// We’ll fill these modules in next steps
// For now, they’re safe empty exports.
import * as routeReflector from "./route-reflector.js";
import * as astParser from "./ast-parser.js";
import * as logicExtractor from "./logic-extractor.js";
import * as sanitizer from "./sanitizer.js";
import * as serializer from "./serializer.js";

/* -------------------------------------------------------
 * Step 1: Setup Analyzer entry
 * ----------------------------------------------------- */
async function startAnalyzer() {
  console.log("\n🚀 Starting Analyzer...");
  console.log("📂 Working directory:", __dirname);

  // Path to your Express routes folder
  const routesDir = path.join(__dirname, "../routes");

  // Check if folder exists
  if (!fs.existsSync(routesDir)) {
    console.error("❌ Routes folder not found:", routesDir);
    return;
  }

  // (Temporary) read all route files — just for setup verification
  const endpoints = routeReflector.scanRoutesDirectory(routesDir);

if (endpoints.length === 0) {
  console.warn("⚠️ No endpoints found in route files.");
} else {
  console.log("✅ Discovered endpoints:");
  endpoints.forEach((ep) =>
    console.log(`   [${ep.method}] ${ep.path} → ${ep.handler}`)
  );
}

const controllerPath = path.join(__dirname, "../controllers/user.controller.js");
const testHandler = endpoints[0]?.handler; // e.g., 'getUsers'

if (testHandler) {
  const extracted = astParser.extractFunctionCode(controllerPath, testHandler);
  console.log("\n🧩 Extracted Function:", testHandler);
  if (extracted) {
  const refined = logicExtractor.refineFunctionLogic(extracted);
  console.log("\n🧩 Extracted Function:", extracted.name);
  console.log("📜 Cleaned Code:\n", refined.cleanedCode);
  console.log("📊 Summary:", refined.summary);
}
if (extracted) {
  const refined = logicExtractor.refineFunctionLogic(extracted);
  const safe = sanitizer.sanitizeCode(refined.cleanedCode);

  console.log("\n🧩 Extracted Function:", extracted.name);
  console.log("📜 Cleaned Code:\n", refined.cleanedCode);
  console.log("📊 Summary:", refined.summary);
  console.log("🛡️ Sanitized Code:\n", safe.safeCode);
  console.log("🧾 Sanitize Note:", safe.note);
}
if (extracted) {
  const refined = logicExtractor.refineFunctionLogic(extracted);
  const safe = sanitizer.sanitizeCode(refined.cleanedCode);

  const payload = serializer.buildPayload(
    endpoints[0],
    refined,
    safe
  );
  const savedFile = serializer.savePayload(payload, "analysis_reports");

  console.log("\n🧩 Extracted Function:", extracted.name);
  console.log("📜 Cleaned Code:\n", refined.cleanedCode);
  console.log("📊 Summary:", refined.summary);
  console.log("🛡️ Sanitized Code:\n", safe.safeCode);
  console.log("🧾 Sanitize Note:", safe.note);
  console.log("💾 Payload saved to:", savedFile);
}

}



  // Placeholder for later steps
  console.log("\n🧠 Analyzer modules loaded:");
  console.log("   routeReflector:", !!routeReflector);
  console.log("   astParser:", !!astParser);
  console.log("   logicExtractor:", !!logicExtractor);
  console.log("   sanitizer:", !!sanitizer);
  console.log("   serializer:", !!serializer);

  console.log("\n✅ Analyzer initialized successfully.");
}

/* -------------------------------------------------------
 * Run the Analyzer if called directly
 * ----------------------------------------------------- */
if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
  startAnalyzer();
}

// Export for programmatic use later (optional)
export { startAnalyzer };
