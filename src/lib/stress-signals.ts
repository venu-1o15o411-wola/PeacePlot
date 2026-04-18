/**
 * Maps face signals to a 0–100 stress score and band. Replace the core mapping with
 * fine-tuned MobileNetV2 logits when a TFLite model is bundled (`assets/models/`).
 */
import type { Category, NormalizedLandmark } from "@mediapipe/tasks-vision";

import type { VisualEstimationResult } from "@/lib/visual-estimation-types";

function clampScore(n: number): number {
  return Math.min(95, Math.max(15, Math.round(n)));
}

function toBands(score: number): VisualEstimationResult["stressBand"] {
  if (score < 40) return "low";
  if (score > 72) return "elevated";
  return "moderate";
}

function finish(raw: number): VisualEstimationResult {
  const stressScore100 = clampScore(raw);
  return { stressScore100, stressBand: toBands(stressScore100) };
}

/** ARKit-style blendshape names from MediaPipe Face Landmarker. */
const BLEND_WEIGHTS: Record<string, number> = {
  browDownLeft: 22,
  browDownRight: 22,
  eyeSquintLeft: 14,
  eyeSquintRight: 14,
  mouthFrownLeft: 18,
  mouthFrownRight: 18,
  jawForward: 12,
  noseSneerLeft: 8,
  noseSneerRight: 8,
  mouthPressLeft: 6,
  mouthPressRight: 6,
};

const SMILE_KEYS = ["mouthSmileLeft", "mouthSmileRight"];

/**
 * Stress estimate from MediaPipe blendshape categories (primary when present).
 * Falls back to landmark geometry if categories are empty.
 */
export function estimateStressFromMediaPipe(
  blendshapeCategories: Category[] | undefined,
  landmarks: NormalizedLandmark[] | undefined,
  imageWidth: number,
  imageHeight: number,
): VisualEstimationResult {
  if (blendshapeCategories?.length) {
    const map = new Map(blendshapeCategories.map((c) => [c.categoryName, c.score]));
    let raw = 26;
    for (const [name, w] of Object.entries(BLEND_WEIGHTS)) {
      raw += (map.get(name) ?? 0) * w;
    }
    let smile = 0;
    for (const k of SMILE_KEYS) smile += map.get(k) ?? 0;
    raw -= smile * 9;
    raw += ((imageWidth + imageHeight) % 11) * 0.3;
    return finish(raw);
  }

  if (landmarks?.length) {
    return estimateStressFromNormalizedLandmarks(landmarks, imageWidth, imageHeight);
  }

  return finish(40);
}

/** Geometry-only fallback when blendshapes are disabled. */
export function estimateStressFromNormalizedLandmarks(
  lm: NormalizedLandmark[],
  imageWidth: number,
  imageHeight: number,
): VisualEstimationResult {
  const idx = (i: number) => lm[i];
  const dist = (a: number, b: number) => {
    const p = idx(a);
    const q = idx(b);
    if (!p || !q) return 0;
    const dx = p.x - q.x;
    const dy = p.y - q.y;
    return Math.hypot(dx, dy);
  };
  /** Canonical face mesh indices (MediaPipe Face Landmarker topology). */
  const mouthOpen = (dist(0, 17) + dist(13, 14)) / 2;
  const eyeW = (dist(33, 263) + dist(133, 362)) / 2;
  const mouthTension = eyeW > 1e-6 ? mouthOpen / eyeW : 0;
  let raw = 34 + mouthTension * 42;
  const browDist = dist(107, 336);
  raw += browDist * 18;
  raw += ((imageWidth + imageHeight) % 13) * 0.25;
  return finish(raw);
}
