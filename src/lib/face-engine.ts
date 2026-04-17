import { Platform } from "react-native";

import type { VisualPipelineOutcome } from "@/lib/visual-estimation-types";

export async function processPhotoForStress(
  uri: string,
  width: number,
  height: number,
): Promise<VisualPipelineOutcome> {
  if (Platform.OS === "web") {
    const { processPhotoForStress: run } = await import("@/lib/face-engine.web");
    return run(uri, width, height);
  }
  const { processPhotoForStress: run } = await import("@/lib/face-engine.native");
  return run(uri, width, height);
}
