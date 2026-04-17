import { estimateStressDemoHash } from "@/lib/stress-from-expo-face";
import type { VisualPipelineOutcome } from "@/lib/visual-estimation-types";

/**
 * Native fallback until a stable iOS-compatible face stack is wired.
 * We avoid linking deprecated expo-face-detector because it currently fails to compile on this toolchain.
 */
export async function processPhotoForStress(
  uri: string,
  width: number,
  height: number,
): Promise<VisualPipelineOutcome> {
  return {
    kind: "success",
    result: estimateStressDemoHash(uri, width, height),
    faceDetectionDemo: true,
    stressEngine: "demo",
  };
}
