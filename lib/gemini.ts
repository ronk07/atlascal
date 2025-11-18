import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Get the most up-to-date Gemini model available.
 * 
 * Current model: gemini-1.5-pro
 * - This is the latest stable Pro model available through @google/generative-ai
 * - Better accuracy for structured JSON output (event extraction) than Flash
 * - Updated regularly by Google with latest improvements
 * 
 * Alternative models to try:
 * - "gemini-1.5-flash" - Faster, lower cost, good for simple tasks
 * - "gemini-2.0-flash-exp" - Experimental, newest features (may not be available)
 * - "gemini-2.5-flash" - Newest flash model, may be more accurate
 * 
 * Note: As of Nov 2025, Gemini 3.0 Pro exists but may require different SDK.
 * Check https://ai.google.dev/ for the latest model availability.
 */
export const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash" // Most up-to-date stable Pro model for event extraction
});

