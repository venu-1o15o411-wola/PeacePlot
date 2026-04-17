import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

import { estimateStressFromMediaPipe } from "@/lib/stress-signals";
import type { VisualPipelineOutcome } from "@/lib/visual-estimation-types";

/** Pin WASM to the installed `@mediapipe/tasks-vision` minor line. */
const TASKS_WASM_VER = "0.10.34";

const FACE_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarker: FaceLandmarker | null = null;
let initPromise: Promise<FaceLandmarker> | null = null;

async function getLandmarker(): Promise<FaceLandmarker> {
  if (landmarker) return landmarker;
  if (!initPromise) {
    initPromise = (async () => {
      const wasm = await FilesetResolver.forVisionTasks(
        `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-wasm@${TASKS_WASM_VER}/wasm`,
        true,
      );
      return FaceLandmarker.createFromOptions(wasm, {
        baseOptions: {
          modelAssetPath: FACE_LANDMARKER_MODEL,
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
  landmarker = await initPromise;
  return landmarker;
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for face analysis."));
    img.src = uri;
  });
}

export async function processPhotoForStress(
  uri: string,
  width: number,
  height: number,
): Promise<VisualPipelineOutcome> {
  const lm = await getLandmarker();
  const imageEl = await loadImage(uri);
  const detection = lm.detect(imageEl);

  if (!detection.faceLandmarks?.length) {
    return {
      kind: "retry",
      message:
        "We couldn’t see a face in this photo. Center your face, ensure good light, and try again.",
    };
  }

  const landmarks = detection.faceLandmarks[0]!;
  const blendCats = detection.faceBlendshapes?.[0]?.categories;

  const result = estimateStressFromMediaPipe(blendCats, landmarks, width, height);

  return {
    kind: "success",
    result,
    faceDetectionDemo: false,
    stressEngine: "mediapipe",
  };
}
