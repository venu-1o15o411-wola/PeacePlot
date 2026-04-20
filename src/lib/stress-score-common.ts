import type { VisualEstimationResult } from "@/lib/visual-estimation-types";

/** Wellness-oriented stress index: **0 = calm**, **100 = high acute load** (not clinical diagnosis). */
export const STRESS_SCORE_MIN = 0;
export const STRESS_SCORE_MAX = 100;

export function clampStressScore0to100(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(STRESS_SCORE_MAX, Math.max(STRESS_SCORE_MIN, Math.round(n)));
}

/** Bands aligned with numeric cut lines used across estimate flows. */
export function stressBandFromScore0to100(score: number): VisualEstimationResult["stressBand"] {
  if (score < 40) return "low";
  if (score > 72) return "elevated";
  return "moderate";
}

/** Map legacy ONNX / formula outputs trained in the 15–95 range into display 0–100. */
export function mapLegacyStressTo0to100(v: number): number {
  const t = Math.min(95, Math.max(15, v));
  return clampStressScore0to100(((t - 15) / 80) * 100);
}
