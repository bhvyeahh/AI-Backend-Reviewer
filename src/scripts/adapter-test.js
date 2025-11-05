/**
 * src/scripts/adapter-test.js
 *
 * This script manually tests the adapter using a saved Gemini raw output file.
 * It loads the SDK JSON response, extracts the model's text,
 * removes markdown fences, and prints a clean analysis summary.
 */

import fs from "fs";
import { cleanGeminiResponse, printAnalysisResult } from "../genai/adapter.js";

// 1️⃣ Load your full Gemini SDK response (the big JSON you saved earlier)
const rawResponse = JSON.parse(fs.readFileSync("gemini_raw_output.txt", "utf8"));

// 2️⃣ Extract the actual AI text block inside candidates[0].content.parts[0].text
const textBlock = rawResponse?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

// 3️⃣ Strip ```json fences, trailing backticks, and extra whitespace
const cleanedText = textBlock
  .replace(/```json/i, "")
  .replace(/```/g, "")
  .trim();

// 4️⃣ Pass the cleaned string to your adapter for parsing and formatting
const result = cleanGeminiResponse(cleanedText);

// 5️⃣ Print the nicely formatted output
printAnalysisResult(result);
