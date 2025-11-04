/**
 * ---------------------------------------------------------
 * Sanitizer Module
 * ---------------------------------------------------------
 * Purpose:
 *   - Scrub sensitive or excessive data from code
 *   - Ensure safety before sending to OpenAI
 * ---------------------------------------------------------
 */

/**
 * Sanitize a code snippet
 * @param {string} code - cleaned function code
 * @returns {Object} - { safeCode, removed, truncated, note }
 */
export function sanitizeCode(code = "") {
  let safeCode = code;
  const removed = [];
  let truncated = false;

  // 1️⃣ Remove hardcoded secrets / keys
  const secretPatterns = [
    /(api[_-]?key\s*=\s*['"`][^'"`]+['"`])/gi,
    /(token\s*=\s*['"`][^'"`]+['"`])/gi,
    /(password\s*=\s*['"`][^'"`]+['"`])/gi,
    /(connectionString\s*=\s*['"`][^'"`]+['"`])/gi,
  ];
  secretPatterns.forEach((pattern) => {
    if (pattern.test(safeCode)) {
      safeCode = safeCode.replace(pattern, "/* 🔒 sanitized */");
      removed.push(pattern.toString());
    }
  });

  // 2️⃣ Mask emails and phone numbers
  safeCode = safeCode
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email_hidden]")
    .replace(/\+?\d[\d\s\-]{8,}\d/g, "[number_hidden]");

  // 3️⃣ Trim large JSON or string literals
  const largeLiteralPattern = /(['"`])({.*?}|[A-Za-z0-9\s]{150,})(['"`])/gs;
  if (largeLiteralPattern.test(safeCode)) {
    safeCode = safeCode.replace(largeLiteralPattern, `"$1[...truncated_literal...]"`);
    truncated = true;
  }

  // 4️⃣ Shorten overall code if huge (safety guard)
  const MAX_LENGTH = 1500;
  if (safeCode.length > MAX_LENGTH) {
    safeCode = safeCode.slice(0, MAX_LENGTH) + "\n/* ...truncated for safety... */";
    truncated = true;
  }

  return {
    safeCode,
    removed,
    truncated,
    note:
      removed.length > 0 || truncated
        ? "⚠️ Sensitive or large content sanitized."
        : "✅ Code safe and ready for AI analysis.",
  };
}
