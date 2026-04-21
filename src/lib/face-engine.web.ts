import { estimateStressFromMediaPipe } from "@/lib/stress-signals";
import type { VisualPipelineOutcome } from "@/lib/visual-estimation-types";
import { getSharedFaceLandmarker } from "@/lib/mediapipe-face-landmarker-shared";

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
  const lm = await getSharedFaceLandmarker();
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
