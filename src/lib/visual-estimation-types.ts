export type VisualEstimationResult = {
  stressBand: "low" | "moderate" | "elevated";
  stressScore100: number;
};

export type StressEngineKind = "mediapipe" | "mlkit" | "finger-ppg" | "demo";

export type VisualPipelineSuccess = {
  kind: "success";
  result: VisualEstimationResult;
  /** True when native face ML was unavailable (e.g. Expo Go) — score is demo-only. */
  faceDetectionDemo: boolean;
  /** Which stack produced the estimate (UI/debug). */
  stressEngine: StressEngineKind;
};

export type VisualPipelineRetry = {
  kind: "retry";
  message: string;
};

export type VisualPipelineOutcome = VisualPipelineSuccess | VisualPipelineRetry;
