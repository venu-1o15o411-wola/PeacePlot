/**
 * Visual stress pipeline entry — platform implementation lives in `face-engine.*`.
 *
 * - **Web:** MediaPipe Face Landmarker (WASM) + blendshape/landmark stress mapping (`stress-signals.ts`).
 * - **iOS / Android:** `expo-face-detector` (Google Mobile Vision) + geometry (`stress-from-expo-face.ts`).
 * - **Expo Go (native):** face module unavailable → demo hash (`stress-from-expo-face.ts`).
 *
 * **MobileNetV2:** Swap the mapping in `stress-signals.ts` / bundle a `.tflite` per `assets/models/README.md`.
 */
export type {
  StressEngineKind,
  VisualEstimationResult,
  VisualPipelineOutcome,
  VisualPipelineRetry,
  VisualPipelineSuccess,
} from "@/lib/visual-estimation-types";

export { processPhotoForStress } from "@/lib/face-engine";
