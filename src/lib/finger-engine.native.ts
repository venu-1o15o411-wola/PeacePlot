import { extractPpgStressFeatures } from "@/lib/ppg-stress-features";
import { predictStressScoreWithPpgOnnx } from "@/lib/ppg-stress-onnx";
import { estimateStressFromPPG, stressBandFromScore100 } from "@/lib/stress-from-finger";

export type FingerSignalError = "NO_FINGER" | "LOW_SIGNAL" | "TOO_SHORT";

export type FingerFrameSample = {
  timestampMs: number;
  red: number;
  green: number;
  blue: number;
  luminanceVariance: number;
};

export type FingerStressSuccess = {
  ok: true;
  stressScore: number;
  stressBand: "low" | "moderate" | "elevated";
  confidence: number;
  /** ONNX MLP when inference succeeds; RMSSD formula fallback if the model cannot run. */
  stressEngine: "finger-ppg-onnx" | "finger-ppg";
  bpm: number;
  rmssd: number;
};

export type FingerStressFailure = {
  ok: false;
  error: FingerSignalError;
};

export type FingerStressResult = FingerStressSuccess | FingerStressFailure;

const RED_MIN = 150;
const VARIANCE_MAX = 900;
const MIN_DURATION_MS = 10_000;
const MIN_SAMPLES = 200;

export function isFingerDetected(frame: FingerFrameSample): boolean {
  return (
    frame.red > RED_MIN &&
    frame.red > frame.green &&
    frame.red > frame.blue &&
    frame.luminanceVariance < VARIANCE_MAX
  );
}

export function collectPPGSignal(
  samples: FingerFrameSample[],
  durationMs: number,
): number[] {
  if (!samples.length || durationMs < MIN_DURATION_MS) return [];
  return samples.map((s) => s.red);
}

function movingAverage(signal: number[], windowSize: number): number[] {
  if (windowSize <= 1 || signal.length <= windowSize) return signal.slice();
  const out = new Array<number>(signal.length);
  let acc = 0;
  for (let i = 0; i < signal.length; i++) {
    acc += signal[i]!;
    if (i >= windowSize) acc -= signal[i - windowSize]!;
    const denom = i + 1 < windowSize ? i + 1 : windowSize;
    out[i] = acc / denom;
  }
  return out;
}

export function detectPeaks(signal: number[]): number[] {
  if (signal.length < 8) return [];
  const smoothed = movingAverage(signal, 5);
  const min = Math.min(...smoothed);
  const max = Math.max(...smoothed);
  const amp = max - min;
  if (amp < 8) return [];
  const threshold = min + amp * 0.62;
  const peaks: number[] = [];
  let lastPeak = -1000;
  const minDistance = 8; // ~260ms at 30fps => max ~230 bpm

  for (let i = 1; i < smoothed.length - 1; i++) {
    const prev = smoothed[i - 1]!;
    const curr = smoothed[i]!;
    const next = smoothed[i + 1]!;
    if (curr > threshold && curr > prev && curr >= next && i - lastPeak >= minDistance) {
      peaks.push(i);
      lastPeak = i;
    }
  }
  return peaks;
}

export function computeHRV(
  peakIndices: number[],
  timestampsMs: number[],
): { bpm: number; rmssd: number } {
  if (peakIndices.length < 2) return { bpm: 0, rmssd: 0 };
  const peakTimes = peakIndices
    .map((idx) => timestampsMs[idx])
    .filter((t): t is number => typeof t === "number");
  if (peakTimes.length < 2) return { bpm: 0, rmssd: 0 };

  const rr = peakTimes
    .slice(1)
    .map((t, i) => t - peakTimes[i]!)
    .filter((v) => v >= 300 && v <= 2000);
  if (rr.length < 2) return { bpm: 0, rmssd: 0 };

  const meanRr = rr.reduce((a, b) => a + b, 0) / rr.length;
  const bpm = (60_000 / meanRr);

  const rrDiffSq = rr
    .slice(1)
    .map((v, i) => {
      const d = v - rr[i]!;
      return d * d;
    });
  const rmssd = Math.sqrt(rrDiffSq.reduce((a, b) => a + b, 0) / rrDiffSq.length);

  return { bpm, rmssd };
}

function signalQuality(signal: number[], peaks: number[]): number {
  if (!signal.length) return 0;
  const min = Math.min(...signal);
  const max = Math.max(...signal);
  const amp = max - min;
  const peakDensity = peaks.length / (signal.length / 30);
  const ampScore = Math.min(1, amp / 35);
  const densityScore = Math.max(0, 1 - Math.min(Math.abs(peakDensity - 1.3), 1.3) / 1.3);
  return Math.round((ampScore * 0.65 + densityScore * 0.35) * 100);
}

export async function runFingerPPGEstimation(
  samples: FingerFrameSample[],
  durationMs: number,
): Promise<FingerStressResult> {
  if (durationMs < MIN_DURATION_MS || samples.length < MIN_SAMPLES) {
    return { ok: false, error: "TOO_SHORT" };
  }

  const fingerValidCount = samples.reduce((acc, sample) => {
    return acc + (isFingerDetected(sample) ? 1 : 0);
  }, 0);
  if (fingerValidCount / samples.length < 0.7) {
    return { ok: false, error: "NO_FINGER" };
  }

  const signal = collectPPGSignal(samples, durationMs);
  if (signal.length < MIN_SAMPLES) {
    return { ok: false, error: "TOO_SHORT" };
  }

  const peaks = detectPeaks(signal);
  if (peaks.length < 8) {
    return { ok: false, error: "LOW_SIGNAL" };
  }

  const timestamps = samples.map((s) => s.timestampMs);
  const { bpm, rmssd } = computeHRV(peaks, timestamps);
  if (!Number.isFinite(bpm) || !Number.isFinite(rmssd) || bpm <= 0 || rmssd <= 0) {
    return { ok: false, error: "LOW_SIGNAL" };
  }

  const confidence = signalQuality(signal, peaks);
  if (confidence < 20) {
    return { ok: false, error: "LOW_SIGNAL" };
  }

  const features = extractPpgStressFeatures({
    samples,
    signal,
    peakIndices: peaks,
    durationMs,
    bpm,
    rmssd,
  });

  let stressScore: number;
  let stressEngine: FingerStressSuccess["stressEngine"];
  try {
    stressScore = await predictStressScoreWithPpgOnnx(features);
    stressEngine = "finger-ppg-onnx";
  } catch {
    const { score } = estimateStressFromPPG(rmssd);
    stressScore = score;
    stressEngine = "finger-ppg";
  }

  const stressBand = stressBandFromScore100(stressScore);

  return {
    ok: true,
    stressScore,
    stressBand,
    confidence,
    stressEngine,
    bpm: Math.round(bpm),
    rmssd: Number(rmssd.toFixed(1)),
  };
}
