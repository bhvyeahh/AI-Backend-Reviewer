/**
 * ---------------------------------------------------------
 *  AI-Powered Code Optimizer - Analyzer Orchestrator
 * ---------------------------------------------------------
 *  Handles:
 *    - Discovering route files
 *    - Letting user select which file & endpoints to analyze
 *    - Parsing via AST
 *    - Cleaning & Sanitizing
 *    - Serializing payloads
 * ---------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import url from "url";
import inquirer from "inquirer";
import * as routeReflector from "./route-reflector.js";
import * as astParser from "./ast-parser.js";
import * as logicExtractor from "./logic-extractor.js";
import * as sanitizer from "./sanitizer.js";
import * as serializer from "./serializer.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startAnalyzer() {
  console.log("\n🚀 Starting Analyzer...");
  console.log("📂 Working directory:", __dirname);

  const routesDir = path.join(__dirname, "../routes");

  if (!fs.existsSync(routesDir)) {
    console.error("❌ Routes folder not found:", routesDir);
    return;
  }

  // ✅ Detect CLI argument (when used via run-full-analysis)
  const cliRouteArg = process.argv[2];
  let selectedRouteFile = cliRouteArg;

  // ✅ Ask user only if no CLI arg provided
  if (!selectedRouteFile) {
    const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith(".js"));
    if (routeFiles.length === 0) {
      console.warn("⚠️ No route files found.");
      return;
    }

    const { selectedRouteFile: chosenFile } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedRouteFile",
        message: "📁 Select which router file you want to analyze:",
        choices: routeFiles,
      },
    ]);
    selectedRouteFile = chosenFile;
  }

  const selectedRoutePath = path.join(routesDir, selectedRouteFile);
  const endpoints = routeReflector.scanRoutesFile(selectedRoutePath);

  if (!endpoints || endpoints.length === 0) {
    console.warn("⚠️ No endpoints found in this route file.");
    return;
  }

  // ✅ Let user choose endpoints interactively
  const { selectedEndpoints } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedEndpoints",
      message: "🧠 Select which endpoints to analyze:",
      choices: endpoints.map(ep => `${ep.method.toUpperCase()} ${ep.path} → ${ep.handler}`),
      pageSize: 10,
      validate: input => input.length > 0 || "Select at least one endpoint to analyze.",
    },
  ]);

  console.log(`\n📊 Selected ${selectedEndpoints.length} endpoint(s):`);
  selectedEndpoints.forEach(e => console.log(`   • ${e}`));

  // ✅ Process each selected endpoint directly
  for (const selected of selectedEndpoints) {
    const endpoint = endpoints.find(
      ep => `${ep.method.toUpperCase()} ${ep.path} → ${ep.handler}` === selected
    );
    if (!endpoint) continue;

    const controllerFile = path.join(
      __dirname,
      `../controllers/${endpoint.controller || "user.controller.js"}`
    );

    console.log(`\n🧩 Extracting Function: ${endpoint.handler} from ${path.basename(controllerFile)}`);

    const extracted = astParser.extractFunctionCode(controllerFile, endpoint.handler);
    if (!extracted) {
      console.warn(`⚠️ Could not extract function ${endpoint.handler}`);
      continue;
    }

    const refined = logicExtractor.refineFunctionLogic(extracted);
    const safe = sanitizer.sanitizeCode(refined.cleanedCode);
    const payload = serializer.buildPayload(endpoint, refined, safe);
    const savedFile = serializer.savePayload(payload, "analysis_reports");

    console.log("📜 Cleaned Code:\n", refined.cleanedCode);
    console.log("📊 Summary:", refined.summary);
    console.log("🛡️ Sanitized Code:\n", safe.safeCode);
    console.log("🧾 Sanitize Note:", safe.note);
    console.log("💾 Payload saved to:", savedFile);
  }

  console.log("\n✅ Analyzer complete for selected endpoints.\n");
}

if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
  startAnalyzer();
}

export { startAnalyzer };
