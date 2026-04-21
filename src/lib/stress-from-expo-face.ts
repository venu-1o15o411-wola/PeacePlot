import {
  clampStressScore0to100,
  stressBandFromScore0to100,
} from "@/lib/stress-score-common";
import type { VisualEstimationResult } from "@/lib/visual-estimation-types";

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
  // Map pose + face share into 0–100 (wider spread than old 15–95 clamp).
  let raw01 = 0.22 * Math.min(1, yaw / 45) + 0.18 * Math.min(1, roll / 35);
  raw01 += 0.28 * (1 - Math.min(Math.max(rel * 4, 0.1), 1));
  const smile = face.smilingProbability;
  if (smile !== undefined) raw01 = Math.max(0, raw01 - smile * 0.32);
  raw01 = Math.min(1, Math.max(0, raw01));
  const stressScore100 = clampStressScore0to100(raw01 * 100);
  return { stressScore100, stressBand: stressBandFromScore0to100(stressScore100) };
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
  const stressScore100 = h % 101;
  return {
    stressScore100,
    stressBand: stressBandFromScore0to100(stressScore100),
  };
}
