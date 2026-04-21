import {
  clampStressScore0to100,
  stressBandFromScore0to100,
} from "@/lib/stress-score-common";
import type { VisualEstimationResult } from "@/lib/visual-estimation-types";

export { stressBandFromScore0to100 as stressBandFromScore100 };

export function estimateStressFromPPG(rmssd: number): {
  score: number;
  band: VisualEstimationResult["stressBand"];
} {
  const bounded = Math.max(5, Math.min(120, rmssd));
  // Lower RMSSD → higher stress index (0–100). Linear across plausible PPG range.
  const linear = 100 - ((bounded - 5) / 115) * 100;
  const score = clampStressScore0to100(linear);
  return { score, band: stressBandFromScore0to100(score) };
}
