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



export function cleanGeminiResponse(rawResponse) {
  if (!rawResponse) return { error: "No response from Gemini" };

  // 🧠 Step 1: Try to find the JSON part between code fences
  let extracted = rawResponse;
  const fenceMatch = rawResponse.match(/```json([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    extracted = fenceMatch[1];
  } else {
    // fallback - find braces if markdown not used
    const start = rawResponse.indexOf("{");
    const end = rawResponse.lastIndexOf("}");
    if (start >= 0 && end > start) {
      extracted = rawResponse.slice(start, end + 1);
    }
  }

  // 🧹 Step 2: Clean up unwanted characters
  extracted = extracted
    .replace(/```/g, "") // remove markdown fences
    .replace(/json/gi, "") // remove 'json' word if left
    .replace(/^[^{}]*?(\{)/, "{") // remove junk before first brace
    .replace(/(\})[^{}]*?$/, "}") // remove junk after last brace
    .trim();

  // 🧩 Step 3: Try parsing inner JSON (with auto-repair)
  let parsed = null;
  try {
    parsed = JSON.parse(extracted);
  } catch (err) {
    console.warn("⚠️ Could not parse Gemini JSON (even after cleanup):", err.message);

    // 🧠 Attempt auto-fix for common malformed JSON patterns
    let fixed = extracted
      .replace(/,\s*([\]}])/g, "$1") // remove trailing commas before ] or }
      .replace(/}\s*{/g, "},{") // add commas between objects if missing
      .replace(/]\s*\[/g, "],[") // add commas between arrays if missing
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // ensure quoted keys
      .replace(/“|”/g, '"'); // replace fancy quotes

    try {
      parsed = JSON.parse(fixed);
      console.log("🩹 Auto-fixed malformed JSON successfully!");
    } catch (err2) {
      console.error("❌ Still invalid after auto-fix:", err2.message);
      return {
        error: "Invalid JSON (even after auto-fix)",
        extracted: extracted.slice(0, 400) + "...",
        raw: rawResponse.slice(0, 400) + "...",
      };
    }
  }

  // 🧠 Step 4: Normalize fields for consistency
  const normalized = {
    summary: parsed.summary || "No summary provided.",
    issues: parsed.issues || [],
    suggestions: parsed.suggestions || [],
    before_after: parsed.before_after || null,
    notes: parsed.notes || "No notes provided.",
  };

  return normalized;
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
