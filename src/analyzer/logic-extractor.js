/**
 * ---------------------------------------------------------
 * Logic Extractor Module
 * ---------------------------------------------------------
 * Purpose:
 *   - Clean up raw function code extracted from AST
 *   - Remove comments, console logs, unnecessary spaces
 *   - Provide summary metadata for AI performance analysis
 * ---------------------------------------------------------
 */

import stripComments from "strip-comments";

/**
 * Clean and analyze function logic
 * @param {Object} extractedFn - { name, code, async, loc }
 * @returns {Object} - cleanedCode, summary
 */
export function refineFunctionLogic(extractedFn) {
  if (!extractedFn || !extractedFn.code) {
    console.warn("⚠️ No extracted function data provided.");
    return null;
  }

  let code = extractedFn.code;

  // Step 1️⃣: Remove comments
  try {
    code = stripComments(code);
  } catch {
    console.warn("⚠️ Comment stripping failed, continuing with raw code.");
  }

  // Step 2️⃣: Remove console logs or debugging statements
  code = code
    .replace(/console\.[a-z]+\([^)]*\);?/gi, "")
    .replace(/\/\*.*?\*\//gs, "")
    .replace(/\/\/.*/g, "")
    .trim();

  // Step 3️⃣: Normalize whitespace and indentation
  code = code.replace(/\n\s*\n/g, "\n").trim();

  // Step 4️⃣: Extract lightweight metadata for performance hints
  const summary = {
    name: extractedFn.name,
    async: extractedFn.async,
    lineCount: code.split("\n").length,
    hasDBCall: /(User|Model|find|insert|update|delete|aggregate)/i.test(code),
    hasLoops: /(for|while)\s*\(/.test(code),
    hasTryCatch: /try\s*{/.test(code),
    hasErrorHandling: /res\.status\s*\(/.test(code),
  };

  return {
    name: extractedFn.name,
    cleanedCode: code,
    summary,
  };
}
