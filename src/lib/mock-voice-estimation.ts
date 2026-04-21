import { clampStressScore0to100, stressBandFromScore0to100 } from "@/lib/stress-score-common";

/**
 * Placeholder stress signal until speech-to-text + model run on Supabase Edge Functions
 * (`plan.md` §6.1). Uses only local metadata (duration)—no audio leaves the device here.
 */
export type VoiceEstimationResult = {
  /** Short mock transcript for UI preview; replace with real STT output later. */
  transcriptPreview: string;
  stressBand: "low" | "moderate" | "elevated";
  /** 0–100 for simple meter copy */
  stressScore100: number;
};

export function mockVoiceEstimationFromDuration(durationSec: number): VoiceEstimationResult {
  if (!Number.isFinite(durationSec) || durationSec < 2) {
    return {
      transcriptPreview:
        "We need a bit more voice to estimate stress. Try recording at least a few seconds.",
      stressBand: "low",
      stressScore100: 22,
    };
  }

  const t = Math.min(1, durationSec / 90);
  const score = Math.round(15 + t * 70 + (durationSec % 11) * 2);
  const stressScore100 = clampStressScore0to100(score);
  const stressBand = stressBandFromScore0to100(stressScore100);

  return {
    transcriptPreview:
      "I've been carrying a lot lately—work deadlines, family, and I haven't been sleeping well. I feel tense most evenings.",
    stressBand,
    stressScore100,
  };
}
