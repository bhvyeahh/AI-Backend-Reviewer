/**
 * ---------------------------------------------------------
 * Route Reflector
 * ---------------------------------------------------------
 * Purpose:
 *   - Scan Express router files to detect endpoints
 *   - Return structured metadata (method, path, handler, controller)
 *
 * Notes:
 *   - Works for both .get(), .post(), etc.
 *   - Supports import/export syntax (ESM)
 *   - Can scan either a single file or a directory
 * ---------------------------------------------------------
 */

import fs from "fs";
import path from "path";

/**
 * Scan a specific route file for Express endpoints
 * @param {string} filePath - absolute path to the route file
 * @returns {Array} endpoints - [{ method, path, handler, controller }]
 */
export function scanRoutesFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn("⚠️ Route file not found:", filePath);
    return [];
  }

  const code = fs.readFileSync(filePath, "utf8");
  const lines = code.split("\n");

  const endpoints = [];

  // Detect the associated controller file (same name logic)
  const baseName = path.basename(filePath, ".js"); // e.g., "user.routes"
  const controllerFile = baseName.replace(".routes", ".controller.js"); // "user.controller.js"

  // Simple regex to catch Express route definitions
  const routeRegex =
    /router\.(get|post|put|delete|patch)\(\s*["'`](.*?)["'`]\s*,\s*([a-zA-Z0-9_]+)/g;

  let match;
  while ((match = routeRegex.exec(code)) !== null) {
    endpoints.push({
      method: match[1].toUpperCase(),
      path: match[2],
      handler: match[3],
      controller: controllerFile,
    });
  }

  return endpoints;
}

/**
 * Scan all route files inside a routes directory
 * @param {string} dirPath - absolute path to routes directory
 * @returns {Array} endpoints - combined list of all endpoints
 */
export function scanRoutesDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.warn("⚠️ Routes directory not found:", dirPath);
    return [];
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".js"));
  const allEndpoints = [];

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const fileEndpoints = scanRoutesFile(fullPath);
    allEndpoints.push(...fileEndpoints);
  }

  return allEndpoints;
}
