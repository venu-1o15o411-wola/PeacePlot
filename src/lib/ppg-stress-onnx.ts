import { Asset } from "expo-asset";
import { mapLegacyStressTo0to100 } from "@/lib/stress-score-common";
import { InferenceSession, Tensor } from "onnxruntime-react-native";

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro asset module
const PPG_ONNX_ASSET = require("../../assets/models/ppg_stress_mlp.onnx");

const INPUT_NAME = "ppg_features";
const OUTPUT_NAME = "variable";

let sessionPromise: Promise<InferenceSession> | null = null;

/** Warm-load the model when the finger screen mounts so the 15s capture + analyze path isn’t blocked on first inference. */
export async function preloadPpgOnnxSession(): Promise<void> {
  try {
    await getPpgOnnxSession();
  } catch {
    /* Fallback path in finger-engine will use RMSSD formula. */
  }
}

async function getPpgOnnxSession(): Promise<InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const asset = Asset.fromModule(PPG_ONNX_ASSET);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      if (!uri) {
        throw new Error("Could not resolve bundled PPG ONNX model path.");
      }
      return InferenceSession.create(uri);
    })();
  }
  return sessionPromise;
}

/**
 * Runs the bundled MLP (`assets/models/ppg_stress_mlp.onnx`) trained offline; see `scripts/export_ppg_stress_onnx.py`.
 * Model outputs are in the legacy 15–95 training range → mapped to **0–100** for UI.
 */
export async function predictStressScoreWithPpgOnnx(features: Float32Array): Promise<number> {
  if (features.length !== 8) {
    throw new Error(`PPG ONNX expects 8 features, got ${features.length}.`);
  }
  const session = await getPpgOnnxSession();
  const input = new Tensor("float32", features, [1, 8]);
  const out = await session.run({ [INPUT_NAME]: input });
  const tensor = out[OUTPUT_NAME];
  if (!tensor) {
    throw new Error("PPG ONNX output missing.");
  }
  let data: Float32Array;
  if ("data" in tensor && tensor.data) {
    data = tensor.data as Float32Array;
  } else if (typeof tensor.getData === "function") {
    const buf = await tensor.getData();
    data = buf as Float32Array;
  } else {
    throw new Error("PPG ONNX output tensor has no readable data.");
  }
  const v = data[0];
  if (!Number.isFinite(v)) {
    throw new Error("PPG ONNX returned non-finite value.");
  }
  return mapLegacyStressTo0to100(v);
}

export function resetPpgOnnxSessionForTests(): void {
  sessionPromise = null;
}
