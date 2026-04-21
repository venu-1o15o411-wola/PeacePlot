import type { FingerFrameSample } from "@/lib/finger-engine.native";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Eight normalized features for `ppg_stress_mlp.onnx`.
 * Must match `scripts/export_ppg_stress_onnx.py` training pipeline.
 */
export function extractPpgStressFeatures(params: {
  samples: FingerFrameSample[];
  signal: number[];
  peakIndices: number[];
  durationMs: number;
  bpm: number;
  rmssd: number;
}): Float32Array {
  const { samples, signal, peakIndices, durationMs, bpm, rmssd } = params;
  if (!samples.length || !signal.length) {
    return new Float32Array(8);
  }

  const durationSec = durationMs / 1000;
  let sumR = 0;
  for (const s of samples) sumR += s.red;
  const meanRed = sumR / samples.length;
  let varAcc = 0;
  for (const s of samples) {
    const d = s.red - meanRed;
    varAcc += d * d;
  }
  const stdRed = Math.sqrt(varAcc / samples.length);

  let minR = signal[0]!;
  let maxR = signal[0]!;
  for (const v of signal) {
    if (v < minR) minR = v;
    if (v > maxR) maxR = v;
  }
  const amp = maxR - minR;

  const x0 = clamp01(rmssd / 120);
  const x1 = clamp01(bpm / 200);
  const x2 = clamp01((meanRed - 100) / 155);
  const x3 = clamp01(stdRed / 50);
  const x4 = clamp01(amp / 100);
  const x5 = clamp01(peakIndices.length / durationSec / 2.5);
  const x6 = clamp01(durationSec / 20);
  const x7 = clamp01(x0 * 0.65 + x4 * 0.35);

  return new Float32Array([x0, x1, x2, x3, x4, x5, x6, x7]);
}
