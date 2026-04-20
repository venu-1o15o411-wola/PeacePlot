/**
 * Visual stress pipeline entry — platform implementation lives in `face-engine.*`.
 *
 * - **Web:** MediaPipe Face Landmarker (`@mediapipe/tasks-vision`, WASM) + `estimateStressFromMediaPipe`.
 * - **iOS / Android:** Same Face Landmarker model in a hidden **WebView** (Hermes cannot host Tasks WASM;
 *   see `FaceLandmarkerWebView` + `face-engine.native.ts`). Mapping in `stress-signals.ts`.
 * - **Expo Go (native):** if the WebView bridge never registers, demo hash fallback (`stress-from-expo-face.ts`).
 *
 * **Future:** Optional fine-tuned classifier on top of landmark features (`assets/models/README.md`).
 */
export type {
  StressEngineKind,
  VisualEstimationResult,
  VisualPipelineOutcome,
  VisualPipelineRetry,
  VisualPipelineSuccess,
} from "@/lib/visual-estimation-types";

export { processPhotoForStress } from "@/lib/face-engine";
