import type { Category, NormalizedLandmark } from "@mediapipe/tasks-vision";

/**
 * iOS/Android run MediaPipe Tasks JS inside a hidden WebView (Hermes has no `document` / canvas).
 * The runner is registered by `FaceLandmarkerWebView` when the WebView finishes loading WASM + model.
 */
export type NativeFaceLandmarkerPayload = {
  faceLandmarks: NormalizedLandmark[] | null;
  categories: Category[] | null;
};

export type NativeFaceLandmarkerRunner = (uri: string) => Promise<NativeFaceLandmarkerPayload>;

let runner: NativeFaceLandmarkerRunner | null = null;

export function setNativeFaceLandmarkerRunner(fn: NativeFaceLandmarkerRunner | null): void {
  runner = fn;
}

export function getNativeFaceLandmarkerRunner(): NativeFaceLandmarkerRunner | null {
  return runner;
}
