import type { VisualEstimationResult } from "@/lib/visual-estimation-types";

function clampScore(n: number): number {
  return Math.min(95, Math.max(15, Math.round(n)));
}

function toBands(score: number): VisualEstimationResult["stressBand"] {
  if (score < 40) return "low";
  if (score > 72) return "elevated";
  return "moderate";
}

/** Native path: Google Mobile Vision `FaceFeature` geometry + optional smile prob. */
export type ExpoFaceFeatureLike = {
  bounds: { size: { width: number; height: number } };
  yawAngle?: number;
  rollAngle?: number;
  smilingProbability?: number;
};

export function estimateStressFromExpoFace(
  face: ExpoFaceFeatureLike,
  imageWidth: number,
  imageHeight: number,
): VisualEstimationResult {
  const frameArea = Math.max(1, imageWidth * imageHeight);
  const boxArea = face.bounds.size.width * face.bounds.size.height;
  const rel = boxArea / frameArea;
  const yaw = Math.abs(face.yawAngle ?? 0);
  const roll = Math.abs(face.rollAngle ?? 0);
  let raw = 30 + yaw * 0.7 + roll * 0.5;
  raw += (1 - Math.min(Math.max(rel * 4, 0.12), 1)) * 16;
  const smile = face.smilingProbability;
  if (smile !== undefined) raw -= smile * 13;
  raw += (imageWidth + imageHeight) % 9;
  const stressScore100 = clampScore(raw);
  return { stressScore100, stressBand: toBands(stressScore100) };
}

export function estimateStressDemoHash(
  imageUri: string,
  imageWidth: number,
  imageHeight: number,
): VisualEstimationResult {
  let h = 0;
  for (let i = 0; i < imageUri.length; i++) {
    h = (Math.imul(31, h) + imageUri.charCodeAt(i)) >>> 0;
  }
  h ^= imageWidth * 486187 ^ imageHeight * 9973;
  const raw = 22 + (h % 58);
  const stressScore100 = clampScore(raw);
  return { stressScore100, stressBand: toBands(stressScore100) };
}
