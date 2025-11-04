/**
 * ---------------------------------------------------------
 * AST Parser Module
 * ---------------------------------------------------------
 * Purpose:
 *   - Parse controller files
 *   - Locate handler functions by name
 *   - Extract their function body text for AI analysis
 *
 * Uses Babel parser for robust JS/ESM parsing.
 * ---------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import * as babelParser from "@babel/parser";
import babelTraverse from "@babel/traverse";
const traverse = babelTraverse.default;

/**
 * Parse a given controller file and extract function logic by name
 * @param {string} filePath - absolute path to controller file
 * @param {string} handlerName - function name (e.g., getUsers)
 * @returns {Object|null} - { name, code, loc, async } or null if not found
 */
export function extractFunctionCode(filePath, handlerName) {
  if (!fs.existsSync(filePath)) {
    console.warn("⚠️ Controller file not found:", filePath);
    return null;
  }

  const code = fs.readFileSync(filePath, "utf-8");

  // 1. Parse code into AST
  const ast = babelParser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "classProperties", "topLevelAwait"],
  });

  let extracted = null;

  // 2. Traverse AST and look for matching function
  traverse(ast, {
    FunctionDeclaration(path) {
      if (path.node.id?.name === handlerName) {
        extracted = {
          name: handlerName,
          code: code.slice(path.node.start, path.node.end),
          loc: path.node.loc,
          async: path.node.async || false,
        };
        path.stop();
      }
    },

    // Also handle arrow or function expressions exported like: export const getUsers = async () => {}
    VariableDeclarator(path) {
      if (path.node.id.name === handlerName) {
        const init = path.node.init;
        if (init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression") {
          extracted = {
            name: handlerName,
            code: code.slice(init.start, init.end),
            loc: path.node.loc,
            async: init.async || false,
          };
          path.stop();
        }
      }
    },
  });

  if (!extracted) {
    console.warn(`⚠️ Handler '${handlerName}' not found in ${path.basename(filePath)}`);
  }

  return extracted;
}
