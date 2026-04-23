import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export function isGeminiConfigured(): boolean {
  return Boolean(apiKey && apiKey.length > 8 && !apiKey.includes("YOUR_"));
}

export type GeminiWellnessInput = {
  transcript: string;
  stressBand: string;
  stressScore100: number;
};

/**
 * Short supportive reflection on the voice check-in. Requires `EXPO_PUBLIC_GEMINI_API_KEY`.
 */
export async function getGeminiWellnessAnalysis(input: GeminiWellnessInput): Promise<string> {
  if (!isGeminiConfigured() || !apiKey) {
    throw new Error("Gemini is not configured (set EXPO_PUBLIC_GEMINI_API_KEY).");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a calm, supportive wellness coach (not a doctor or therapist). The user completed a short voice check-in for stress awareness.

Their words (transcript):
"""
${input.transcript.slice(0, 8000)}
"""

App placeholder stress estimate: band "${input.stressBand}", score ${input.stressScore100} (informational only, not clinical).

Write 2–4 short paragraphs:
- Acknowledge what they shared without judging.
- Offer one or two gentle, practical ideas to regulate stress (breathing, boundaries, sleep hygiene, reaching out).
- Encourage professional help if they describe crisis or severe symptoms.

Use plain language, warm tone, no medical diagnosis, no § symbol.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text?.trim()) {
    throw new Error("Gemini returned empty text.");
  }
  return text.trim();
}
