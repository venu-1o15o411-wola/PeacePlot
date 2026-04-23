export type VoiceEstimateSessionPayload = {
  transcript: string;
  guidance: string;
};

let session: VoiceEstimateSessionPayload | null = null;

/** Holds full transcript + Gemini guidance so we do not put huge strings in URL params. */
export function setVoiceEstimateSession(data: VoiceEstimateSessionPayload): void {
  session = data;
}

/** Clears and returns the session once (e.g. result screen). */
export function consumeVoiceEstimateSession(): VoiceEstimateSessionPayload | null {
  const out = session;
  session = null;
  return out;
}
