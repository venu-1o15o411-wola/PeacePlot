import type { VisualEstimationResult } from "@/lib/visual-estimation-types";

function clampScore(n: number): number {
  return Math.min(95, Math.max(15, Math.round(n)));
}

function toBand(score: number): VisualEstimationResult["stressBand"] {
  if (score < 40) return "low";
  if (score > 72) return "elevated";
  return "moderate";
}

export function estimateStressFromPPG(rmssd: number): {
  score: number;
  band: VisualEstimationResult["stressBand"];
} {
  const bounded = Math.max(5, Math.min(120, rmssd));
  // Lower RMSSD is correlated with higher acute stress; map inversely.
  const normalized = 100 - ((bounded - 5) / 115) * 100;
  const score = clampScore(normalized);
  return { score, band: toBand(score) };
}
