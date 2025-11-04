/**
 * ---------------------------------------------------------
 * Serializer Module
 * ---------------------------------------------------------
 * Purpose:
 *   - Combine endpoint metadata, refined logic, and sanitized code
 *   - Produce a clean JSON payload ready for AI or storage
 * ---------------------------------------------------------
 */

import fs from "fs";
import path from "path";

/**
 * Build a final JSON payload for one endpoint
 * @param {Object} endpoint - { method, path, handler, file }
 * @param {Object} refined - { name, cleanedCode, summary }
 * @param {Object} sanitized - { safeCode, note }
 * @returns {Object} payload
 */
export function buildPayload(endpoint, refined, sanitized) {
  return {
    endpoint: {
      method: endpoint.method,
      path: endpoint.path,
      file: endpoint.file,
      handler: endpoint.handler,
    },
    function: {
      name: refined.name,
      async: refined.summary.async,
      lines: refined.summary.lineCount,
      cleanedCode: refined.cleanedCode,
      sanitizedCode: sanitized.safeCode,
      safetyNote: sanitized.note,
    },
    metadata: refined.summary,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Save payload to a local JSON file
 * @param {Object} payload
 * @param {string} [outputDir="output"]
 * @returns {string} filePath
 */
export function savePayload(payload, outputDir = "output") {
  const dir = path.resolve(process.cwd(), outputDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const fileNameSafe = `${payload.function.name}_${Date.now()}.json`;
  const filePath = path.join(dir, fileNameSafe);

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");

  return filePath;
}
