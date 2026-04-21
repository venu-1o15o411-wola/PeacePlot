/**
 * Maps MediaPipe Face Landmarker outputs to a **0–100** stress index (higher = more acute load).
 * Uses blendshape categories when present; otherwise normalized landmark geometry.
 */
import type { Category, NormalizedLandmark } from "@mediapipe/tasks-vision";

import {
  clampStressScore0to100,
  stressBandFromScore0to100,
} from "@/lib/stress-score-common";
import type { VisualEstimationResult } from "@/lib/visual-estimation-types";

function finish(score: number): VisualEstimationResult {
  const stressScore100 = clampStressScore0to100(score);
  return { stressScore100, stressBand: stressBandFromScore0to100(stressScore100) };
}

/** Primary “strain / negative affect” blendshapes (MediaPipe names). */
const STRESS_BLEND: Record<string, number> = {
  browDownLeft: 20,
  browDownRight: 20,
  eyeSquintLeft: 14,
  eyeSquintRight: 14,
  mouthFrownLeft: 18,
  mouthFrownRight: 18,
  jawForward: 14,
  jawOpen: 12,
  mouthFunnel: 10,
  noseSneerLeft: 8,
  noseSneerRight: 8,
  mouthPressLeft: 7,
  mouthPressRight: 7,
  mouthStretchLeft: 6,
  mouthStretchRight: 6,
  cheekSquintLeft: 5,
  cheekSquintRight: 5,
};

const CALM_BLEND: Record<string, number> = {
  mouthSmileLeft: 12,
  mouthSmileRight: 12,
};

/**
 * Theoretical max positive contribution if all stress blendshapes = 1.
 * (Used to normalize raw activation to 0–1 before scaling to 0–100.)
 */
function maxStressActivation(): number {
  return Object.values(STRESS_BLEND).reduce((a, b) => a + b, 0);
}

function maxCalmActivation(): number {
  return Object.values(CALM_BLEND).reduce((a, b) => a + b, 0);
}

/**
 * Stress estimate from MediaPipe blendshape categories (primary when present).
 */
export function estimateStressFromMediaPipe(
  blendshapeCategories: Category[] | undefined,
  landmarks: NormalizedLandmark[] | undefined,
  imageWidth: number,
  imageHeight: number,
): VisualEstimationResult {
  if (blendshapeCategories?.length) {
    const map = new Map(blendshapeCategories.map((c) => [c.categoryName, c.score]));
    let stressAct = 0;
    for (const [name, w] of Object.entries(STRESS_BLEND)) {
      stressAct += w * Math.min(1, Math.max(0, map.get(name) ?? 0));
    }
    let calmAct = 0;
    for (const [name, w] of Object.entries(CALM_BLEND)) {
      calmAct += w * Math.min(1, Math.max(0, map.get(name) ?? 0));
    }

    const maxS = maxStressActivation();
    const maxC = maxCalmActivation();
    const tension01 = maxS > 0 ? stressAct / maxS : 0;
    const calm01 = maxC > 0 ? calmAct / maxC : 0;

    /** Asymmetry in brows / eyes (often varies across people and poses). */
    const browL = map.get("browDownLeft") ?? 0;
    const browR = map.get("browDownRight") ?? 0;
    const eyeL = map.get("eyeSquintLeft") ?? 0;
    const eyeR = map.get("eyeSquintRight") ?? 0;
    const asym = (Math.abs(browL - browR) + Math.abs(eyeL - eyeR)) / 2;

    // Combine: tension vs calm, plus mild asymmetry channel for spread.
    let combined01 =
      0.72 * tension01 + 0.18 * (1 - calm01) + 0.1 * Math.min(1, asym * 1.8);
    combined01 = Math.min(1, Math.max(0, combined01));

    const score = combined01 * 100;
    return finish(score);
  }

  if (landmarks?.length) {
    return estimateStressFromNormalizedLandmarks(landmarks, imageWidth, imageHeight);
  }

  return finish(50);
}

/** Geometry-only path: ratios normalized by face scale (eye span). */
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
    return Math.hypot(p.x - q.x, p.y - q.y);
  };

  const eyeW = (dist(33, 263) + dist(133, 362)) / 2;
  const faceScale = eyeW > 1e-6 ? eyeW : 0.08;

  const mouthOpen = (dist(0, 17) + dist(13, 14)) / 2;
  const mouthTension = mouthOpen / faceScale;

  const browDist = dist(107, 336) / faceScale;

  /** Eye-opening asymmetry (normalized) — adds spread across captures. */
  const eyeOpenL = dist(33, 133);
  const eyeOpenR = dist(362, 263);
  const eyeAsym = Math.abs(eyeOpenL - eyeOpenR) / faceScale;

  // Map typical ranges into 0–1 (empirical; tuned for differentiation on selfies).
  const mt = Math.min(1, Math.max(0, (mouthTension - 0.15) / 1.35));
  const br = Math.min(1, Math.max(0, (browDist - 0.35) / 1.1));
  const as = Math.min(1, Math.max(0, eyeAsym / 0.45));

  const aspect = imageWidth > 0 && imageHeight > 0 ? imageWidth / imageHeight : 1;
  const portraitBias = Math.min(0.06, Math.abs(aspect - 0.75) * 0.12);

  let combined01 = 0.46 * mt + 0.36 * br + 0.12 * as + portraitBias;
  combined01 = Math.min(1, Math.max(0, combined01));

  return finish(combined01 * 100);
}
