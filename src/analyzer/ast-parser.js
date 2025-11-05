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
import traverse from "@babel/traverse";

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

  const code = fs.readFileSync(filePath, "utf8");

  // Parse JS/ESM syntax
  const ast = babelParser.parse(code, {
    sourceType: "module",
    plugins: [
      "jsx",
      "classProperties",
      "topLevelAwait",
      "optionalChaining",
      "objectRestSpread",
    ],
  });

  let extracted = null;

  // Traverse the AST to find our handler
  traverse.default(ast, {
    // Regular named function declarations
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

    // Arrow or Function expressions assigned to variables
    VariableDeclarator(path) {
      if (path.node.id?.name === handlerName) {
        const init = path.node.init;
        if (
          init &&
          (init.type === "ArrowFunctionExpression" ||
            init.type === "FunctionExpression")
        ) {
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

    // export const getUsers = ...
    ExportNamedDeclaration(path) {
      const decl = path.node.declaration;
      if (
        decl &&
        decl.declarations &&
        decl.declarations[0].id.name === handlerName
      ) {
        const init = decl.declarations[0].init;
        if (init) {
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
