import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

/** Keep in sync with `package.json` `@mediapipe/tasks-vision` and WebView bridge HTML. */
export const TASKS_WASM_VER = "0.10.34";

export const FACE_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

/** Single Face Landmarker instance for web (browser has `document` / canvas). */
export function getSharedFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      /** WASM ships inside `tasks-vision`; `@mediapipe/tasks-wasm` is not a standalone npm package. */
      // Second parameter is `useModule` (ES6 wasm), not SIMD. Browsers handle `true` well; WebView uses `false` (see face-landmarker-webview).
      const wasm = await FilesetResolver.forVisionTasks(
        `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_WASM_VER}/wasm`,
        true,
      );
      return FaceLandmarker.createFromOptions(wasm, {
        baseOptions: {
          modelAssetPath: FACE_LANDMARKER_MODEL_URL,
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
        minFaceDetectionConfidence: 0.4,
        minFacePresenceConfidence: 0.35,
      });
    })();
  }
  return landmarkerPromise;
}
