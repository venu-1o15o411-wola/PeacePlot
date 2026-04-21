import Constants from "expo-constants";
import type { Category, NormalizedLandmark } from "@mediapipe/tasks-vision";

import { getNativeFaceLandmarkerRunner } from "@/lib/face-landmarker-native-bridge";
import type { VisualPipelineOutcome } from "@/lib/visual-estimation-types";
import { estimateStressDemoHash } from "@/lib/stress-from-expo-face";
import { estimateStressFromMediaPipe } from "@/lib/stress-signals";

function hasLandmarks(
  faceLandmarks: NormalizedLandmark[] | null | undefined,
): faceLandmarks is NormalizedLandmark[] {
  return Array.isArray(faceLandmarks) && faceLandmarks.length > 0;
}

function hasUsableCategories(categories: Category[] | null | undefined): boolean {
  return Array.isArray(categories) && categories.length > 0;
}

/**
 * Native: MediaPipe Face Landmarker runs in a hidden WebView (see `FaceLandmarkerWebView`) because
 * Hermes has no `document`/canvas required by `@mediapipe/tasks-vision` WASM.
 */
export async function processPhotoForStress(
  uri: string,
  width: number,
  height: number,
): Promise<VisualPipelineOutcome> {
  const runner = getNativeFaceLandmarkerRunner();
  const isExpoGo = Constants.appOwnership === "expo";

  if (!runner) {
    if (isExpoGo) {
      return {
        kind: "success",
        result: estimateStressDemoHash(uri, width, height),
        faceDetectionDemo: true,
        stressEngine: "demo",
      };
    }
    return {
      kind: "retry",
      message: "Face analysis is still starting. Wait a few seconds and try again.",
    };
  }

  try {
    const payload = await runner(uri);

    if (!hasLandmarks(payload.faceLandmarks) && !hasUsableCategories(payload.categories)) {
      return {
        kind: "retry",
        message:
          "We couldn’t see a face in this photo. Center your face, ensure good light, and try again.",
      };
    }

    const landmarks = hasLandmarks(payload.faceLandmarks) ? payload.faceLandmarks : undefined;
    const blendCats = hasUsableCategories(payload.categories) ? payload.categories : undefined;

    const result = estimateStressFromMediaPipe(
      blendCats ?? undefined,
      landmarks,
      width,
      height,
    );

    return {
      kind: "success",
      result,
      faceDetectionDemo: false,
      stressEngine: "mediapipe",
    };
  } catch (e) {
    if (isExpoGo) {
      return {
        kind: "success",
        result: estimateStressDemoHash(uri, width, height),
        faceDetectionDemo: true,
        stressEngine: "demo",
      };
    }
    return {
      kind: "retry",
      message:
        e instanceof Error
          ? e.message
          : "Face analysis failed. Try again with good lighting and your face centered.",
    };
  }
}
