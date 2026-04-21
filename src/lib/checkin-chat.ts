import { FunctionsHttpError } from "@supabase/functions-js";

import { requireSupabase } from "@/lib/supabase";

export type CheckinChatResponse = {
  sessionId: string;
  assistantMessage: string;
  status: "continue" | "finished";
  finalSummary: string | null;
  uiHints: { showRecommendations: boolean; resultScore?: number | null };
};

/** Must match the Edge Function name in Supabase (Dashboard → Edge Functions). */
const FUNCTION_NAME = "question-checkin";

async function messageFromFunctionsError(error: FunctionsHttpError): Promise<string> {
  const res = error.context as Response;
  const status = res.status;
  let bodyText = "";
  try {
    bodyText = await res.clone().text();
  } catch {
    return `Check-in failed (HTTP ${status}). Open Supabase → Edge Functions → ${FUNCTION_NAME} → Logs.`;
  }
  if (!bodyText.trim()) {
    return `Check-in failed (HTTP ${status}). See Edge Function logs in Supabase.`;
  }
  try {
    const body = JSON.parse(bodyText) as { error?: string; detail?: string };
    const msg = typeof body.error === "string" ? body.error : "";
    const detail = typeof body.detail === "string" ? body.detail : "";
    if (msg === "SERVICE_BUSY") {
      return detail || "Check-in is busy right now. Please try again in a moment.";
    }
    const combined = [msg, detail].filter(Boolean).join(": ");
    if (combined) {
      return status >= 400 ? `${combined} (HTTP ${status})` : combined;
    }
  } catch {
    /* not JSON */
  }
  if (status === 503) {
    return "Check-in is busy right now. Please try again in a moment.";
  }
  const short = bodyText.length > 280 ? `${bodyText.slice(0, 280)}…` : bodyText;
  return `${short} (HTTP ${status})`;
}

/**
 * Calls Supabase Edge Function `question-checkin` (Gemini + DB). Requires signed-in user.
 * Uses `supabase.functions.invoke` — the client attaches the session JWT automatically.
 * @param sessionId Pass `null` to create a new session (opening greeting).
 */
export async function invokeCheckinChat(params: {
  sessionId: string | null;
  message: string;
  timezone?: string;
}): Promise<CheckinChatResponse> {
  const client = requireSupabase();
  const {
    data: { session },
  } = await client.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sign in to use the check-in.");
  }

  const tz =
    params.timezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone ??
    "UTC";

  const { data, error } = await client.functions.invoke<CheckinChatResponse>(
    FUNCTION_NAME,
    {
      body: {
        sessionId: params.sessionId,
        message: params.message,
        clientContext: { timezone: tz },
      },
    },
  );

  if (error) {
    if (error instanceof FunctionsHttpError) {
      throw new Error(await messageFromFunctionsError(error));
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : `Check-in failed. Deploy "${FUNCTION_NAME}" and set GEMINI_API_KEY secret.`,
    );
  }

  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as CheckinChatResponse).assistantMessage !== "string"
  ) {
    throw new Error("Invalid response from check-in service.");
  }

  return data;
}
