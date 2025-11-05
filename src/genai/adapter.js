/**
 * src/genai/adapter.js
 *
 * Purpose:
 *  - Parse Gemini's raw API responses into clean structured data.
 *  - Extract JSON even if wrapped in markdown or text.
 *  - Normalize the output so the rest of the app can easily use it.
 *
 * Input:
 *  The "raw" property returned from analyzeEndpoint()
 *
 * Output:
 *  {
 *    summary: "...",
 *    issues: [...],
 *    suggestions: [...],
 *    before_after: "...",
 *    notes: "..."
 *  }
 */



import { writeFileSync, mkdirSync } from "fs";
import path from "path";

export function cleanGeminiResponse(rawResponse) {
  if (!rawResponse) return { error: "No response from Gemini" };

  let text = rawResponse;

  // 1️⃣ Parse outer Gemini wrapper if present
  try {
    const obj = typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;
    const maybeText =
      obj?.candidates?.[0]?.content?.parts?.[0]?.text ||
      obj?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      obj?.candidates?.[0]?.content?.text;
    if (maybeText) text = maybeText;
  } catch {
    /* ignore */
  }

  // 2️⃣ Unescape multiple layers
  try {
    let attempts = 0;
    while (
      typeof text === "string" &&
      (text.includes("\\n") || text.includes("\\\"")) &&
      attempts < 3
    ) {
      text = JSON.parse(`"${text}"`);
      attempts++;
    }
  } catch {
    /* ignore */
  }

  // 3️⃣ Extract content inside ```json ... ```
  let extracted = text;
  const fenceMatch = text.match(/```json([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) extracted = fenceMatch[1];
  else {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) extracted = text.slice(start, end + 1);
  }

  // 4️⃣ Cleanup
  extracted = extracted
    .replace(/```/g, "")
    .replace(/json/gi, "")
    .replace(/^[^\{]*\{/, "{")
    .replace(/\}[^\}]*$/, "}")
    .replace(/[\r\n\t]/g, " ")
    .replace(/,\s*}/g, "}")
    .replace(/,\s*\]/g, "]")
    .trim();

  // 5️⃣ Auto-close unbalanced brackets
  const openBraces = (extracted.match(/\{/g) || []).length;
  const closeBraces = (extracted.match(/\}/g) || []).length;
  const openBrackets = (extracted.match(/\[/g) || []).length;
  const closeBrackets = (extracted.match(/\]/g) || []).length;

  let fix = extracted;
  if (openBrackets > closeBrackets) fix += "]".repeat(openBrackets - closeBrackets);
  if (openBraces > closeBraces) fix += "}".repeat(openBraces - closeBraces);

  // 6️⃣ Parse JSON safely
  let parsed;
  try {
    parsed = JSON.parse(fix);
  } catch (err1) {
    console.warn("⚠️ Could not parse Gemini JSON:", err1.message);
    try {
      const fixed = fix
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
        .replace(/:\s*'([^']*)'/g, ': "$1"')
        .replace(/,\s*}/g, "}")
        .replace(/,\s*\]/g, "]");
      parsed = JSON.parse(fixed);
    } catch (err2) {
      console.warn("❌ Still invalid after deep fix:", err2.message);
      dumpDebugFiles(rawResponse, fix);
      return { error: "Invalid JSON (even after deep fix)", extracted: fix };
    }
  }

if (typeof parsed.before_after === "string") {
  // Unescape newlines and quotes so code block looks nice
  parsed.before_after = parsed.before_after
    .replace(/\\\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/```javascript/g, "")
    .replace(/```/g, "")
    .trim();
}


  // 7️⃣ Normalize output
  return {
    summary: parsed.summary || "No summary provided.",
    issues: parsed.issues || [],
    suggestions: parsed.suggestions || [],
    before_after: parsed.before_after || null,
    notes: parsed.notes || "No notes provided.",
  };
}

function dumpDebugFiles(raw, extracted) {
  try {
    const dir = path.join(process.cwd(), "src", "logs");
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "debug_last_response.json"), JSON.stringify({ raw, extracted }, null, 2));
    console.log("🪶 Debug dump saved to src/logs/debug_last_response.json");
  } catch {
    /* ignore */
  }
}





/**
 * Pretty-print adapter output in a readable way
 * (Optional helper for CLI output)
 */
export function printAnalysisResult(result) {
  console.log("\n🧠 Gemini AI Analysis Result:");
  console.log("──────────────────────────────");

  if (result.error) {
    console.log("❌ Error:", result.error);
    console.log("──────────────────────────────\n");
    return;
  }

  console.log("📋 Summary:", result.summary || "No summary");

  console.log("\n⚠️ Issues:");
  (result.issues || []).forEach((i, idx) => {
    const desc = typeof i === "string" ? i : i.description || JSON.stringify(i);
    console.log(`  ${idx + 1}. ${desc}`);
  });

  console.log("\n💡 Suggestions:");
  (result.suggestions || []).forEach((s, idx) => {
    const desc = typeof s === "string" ? s : s.description || JSON.stringify(s);
    console.log(`  ${idx + 1}. ${desc}`);
  });

  if (result.before_after) {
    console.log("\n🔄 Before/After Example:\n");
    console.log(result.before_after);
  }

  console.log("\n📝 Notes:", result.notes || "None");
  console.log("──────────────────────────────\n");
}
