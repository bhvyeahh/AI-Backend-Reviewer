/**
 * ---------------------------------------------------------
 * Route Reflector Module
 * ---------------------------------------------------------
 *  Purpose:
 *   - Scan Express route files
 *   - Identify route definitions (GET, POST, etc.)
 *   - Return structured metadata for each endpoint
 *
 *  Works using:
 *   - Basic file read + regex pattern matching
 *
 *  Example output:
 *   [
 *     { method: 'GET', path: '/users', handler: 'getUsers', file: 'src/routes/user.routes.js' }
 *   ]
 * ---------------------------------------------------------
 */

import fs from "fs";
import path from "path";

/**
 * Extract endpoints from a single route file
 * @param {string} filePath - absolute path to route file
 * @returns {Array} - list of {method, path, handler, file}
 */
export function extractEndpointsFromFile(filePath) {
  const code = fs.readFileSync(filePath, "utf-8");
  const endpoints = [];

  // Simple regex to catch router.METHOD('/path', handler)
  const routePattern =
    /router\.(get|post|put|delete|patch|options|head)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([\w$]+)/gi;

  let match;
  while ((match = routePattern.exec(code)) !== null) {
    const [, method, routePath, handler] = match;
    endpoints.push({
      method: method.toUpperCase(),
      path: routePath,
      handler,
      file: path.relative(process.cwd(), filePath),
    });
  }

  return endpoints;
}

/**
 * Scan all route files in given directory
 * @param {string} routesDir - directory path
 * @returns {Array} - all discovered routes across files
 */
export function scanRoutesDirectory(routesDir) {
  const routeFiles = fs.readdirSync(routesDir).filter((f) => f.endsWith(".js"));
  let allEndpoints = [];

  routeFiles.forEach((file) => {
    const fullPath = path.join(routesDir, file);
    const endpoints = extractEndpointsFromFile(fullPath);
    allEndpoints = allEndpoints.concat(endpoints);
  });

  return allEndpoints;
}
