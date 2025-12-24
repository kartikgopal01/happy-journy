import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | undefined;

export function getGeminiClient() {
  if (genAI) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY env var");
  }
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

export function getGenerativeModel(modelName?: string) {
  const client = getGeminiClient();
  // Use gemini-1.5-flash or gemini-1.5-pro which are supported in v1beta
  // Fallback to gemini-pro for backward compatibility
  const resolved = modelName || process.env.GEMINI_MODEL || "gemini-1.5-flash";
  return client.getGenerativeModel({ model: resolved });
}


