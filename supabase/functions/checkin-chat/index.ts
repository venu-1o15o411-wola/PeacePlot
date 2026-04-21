/**
 * PeacePlot — Question-based check-in chat (Edge Function)
 * Deploy name must match what the app calls: default is `question-checkin`
 * (see src/lib/checkin-chat.ts FUNCTION_NAME). Dashboard → Edge Functions → deploy,
 * or CLI: supabase functions deploy question-checkin (rename folder to match).
 *
 * Secrets (Dashboard → Project Settings → Edge Functions → Secrets):
 *   GEMINI_API_KEY   = Google AI Studio key (never put in Expo)
 *
 * Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Invoke (from app): POST /functions/v1/question-checkin
 *   Headers: Authorization: Bearer <user_access_token>
 *             Content-Type: application/json
 *   Body: { "sessionId": null | "<uuid>", "message": "<user text>", "clientContext": { "timezone": "..." } }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ClientRequest = {
  sessionId?: string | null;
  message?: string;
  clientContext?: { timezone?: string };
};

type ChatPayload = {
  assistant_message?: unknown;
  should_finish?: unknown;
  current_state?: Record<string, unknown>;
  stress_understanding?: Record<string, unknown>;
  recommendation_tags?: unknown;
  memory_candidates?: unknown;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeResultScore(
  stressLevel: unknown,
  confidenceRaw: unknown,
): number | null {
  const level = typeof stressLevel === "string" ? stressLevel : "";
  const baseByStress: Record<string, number> = {
    high: 10,
    elevated: 30,
    moderate: 50,
    mild: 70,
    low: 90,
  };
  const base = baseByStress[level];
  if (typeof base !== "number") return null;

  const confidence =
    typeof confidenceRaw === "number" && Number.isFinite(confidenceRaw)
      ? clamp01(confidenceRaw)
      : 0.6;

  // Lower confidence pulls the score toward neutral (50).
  const blended = base * confidence + 50 * (1 - confidence);
  return Math.round(Math.max(0, Math.min(100, blended)));
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function conversationSystemPrompt(
  displayName: string,
  memorySummary: string,
  timezone: string,
): string {
  return `You are a calm, kind check-in companion for PeacePlot.
User first name or display context: "${displayName}".
User timezone: ${timezone}.
${memorySummary ? `Relevant memory notes (hints only, not facts):\n${memorySummary}\n` : ""}

Rules:
- short, natural, warm, non-clinical.
- one reflection or one question only.
- do not use em dashes. do not use bullet/list formatting in assistant_message.
- avoid using the user's name unless explicitly requested.
- mark should_finish true only when you can give a complete helpful summary.
- output ONLY JSON (no markdown) with exactly:
{
  "assistant_message": string,
  "should_finish": boolean,
  "current_state": {
    "stress_level": "low|mild|moderate|elevated|high",
    "mood_valence": "negative|mixed|neutral|positive",
    "energy_level": "low|medium|high",
    "confidence": number
  },
  "stress_understanding": {
    "primary_sources": string[],
    "secondary_sources": string[],
    "urgency_level": "low|medium|high",
    "internal_summary": string
  },
  "recommendation_tags": string[]
}`;
}

function finalSummarySystemPrompt(
  displayName: string,
  timezone: string,
): string {
  return `You are finalizing a wellness check-in for PeacePlot.
User first name or display context: "${displayName}".
User timezone: ${timezone}.

Write a high-quality final response that feels human and specific:
- validate emotion
- mention likely stress/source pattern
- give 1 or 2 gentle practical next steps
- hopeful but not overly cheerful
- no em dashes, no bullet formatting
- do not use user's name unless requested

Output ONLY JSON with exactly:
{
  "assistant_message": string,
  "current_state": {
    "stress_level": "low|mild|moderate|elevated|high",
    "mood_valence": "negative|mixed|neutral|positive",
    "energy_level": "low|medium|high",
    "confidence": number
  },
  "stress_understanding": {
    "primary_sources": string[],
    "secondary_sources": string[],
    "urgency_level": "low|medium|high",
    "internal_summary": string
  },
  "recommendation_tags": string[]
}`;
}

function normalizeAssistantMessage(message: string, displayName: string): string {
  let out = message.trim();
  if (!out) return out;

  const escapedName = displayName
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (escapedName) {
    // Remove frequent "Name, ..." opener to keep tone less templated.
    out = out.replace(new RegExp(`^${escapedName}\\s*[,!:\\-–—]\\s*`, "i"), "");
  }

  // Prefer softer punctuation over em dashes/hyphen separators.
  out = out.replace(/\s*[—–]\s*/g, ", ");
  return out;
}

function buildGeminiContents(
  history: { role: "user" | "assistant"; content: string }[],
  newUserLine: string | null,
): { role: string; parts: { text: string }[] }[] {
  const out: { role: string; parts: { text: string }[] }[] = [];
  for (const m of history) {
    out.push({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    });
  }
  if (newUserLine !== null) {
    out.push({ role: "user", parts: [{ text: newUserLine }] });
  }
  return out;
}

function parseGeminiJson(text: string): ChatPayload {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
  const data = JSON.parse(trimmed) as ChatPayload;
  if (typeof data.assistant_message !== "string") {
    throw new Error("Invalid model JSON shape");
  }
  return data;
}

async function callGeminiOnce(
  apiKey: string,
  systemText: string,
  contents: { role: string; parts: { text: string }[] }[],
): Promise<ChatPayload> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemText }] },
      contents,
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 320,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GEMINI_HTTP_${res.status}:${errText.slice(0, 350)}`);
  }
  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no text");
  }
  return parseGeminiJson(text);
}

async function callGeminiWithRetry(
  apiKey: string,
  systemText: string,
  contents: { role: string; parts: { text: string }[] }[],
): Promise<ChatPayload> {
  const delays = [0, 350, 1100];
  let lastError: unknown = null;
  for (let i = 0; i < delays.length; i += 1) {
    if (delays[i] > 0) await sleep(delays[i]);
    try {
      return await callGeminiOnce(apiKey, systemText, contents);
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : String(e);
      const retryable =
        msg.includes("GEMINI_HTTP_503") ||
        msg.includes("GEMINI_HTTP_429");
      if (!retryable || i === delays.length - 1) {
        throw e;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Gemini failed");
}

function asStringArray(x: unknown): string[] {
  return Array.isArray(x) ? x.map((v) => String(v)).filter(Boolean).slice(0, 6) : [];
}

function normalizeModelPayload(payload: ChatPayload): {
  assistantMessage: string;
  shouldFinish: boolean;
  current: Record<string, unknown>;
  stressUnderstanding: Record<string, unknown>;
  recommendationTags: string[];
  memoryCandidates: Record<string, unknown>[];
} {
  const current = (payload.current_state ?? {}) as Record<string, unknown>;
  const stressUnderstanding = (payload.stress_understanding ?? {}) as Record<string, unknown>;
  const candidates = Array.isArray(payload.memory_candidates)
    ? (payload.memory_candidates as Record<string, unknown>[])
    : [];
  return {
    assistantMessage: String(payload.assistant_message ?? "").trim(),
    shouldFinish: payload.should_finish === true,
    current: {
      stress_level: typeof current.stress_level === "string" ? current.stress_level : "moderate",
      mood_valence: typeof current.mood_valence === "string" ? current.mood_valence : "mixed",
      energy_level: typeof current.energy_level === "string" ? current.energy_level : "medium",
      confidence:
        typeof current.confidence === "number" && Number.isFinite(current.confidence)
          ? clamp01(current.confidence)
          : 0.62,
    },
    stressUnderstanding: {
      primary_sources: asStringArray(stressUnderstanding.primary_sources),
      secondary_sources: asStringArray(stressUnderstanding.secondary_sources),
      urgency_level:
        typeof stressUnderstanding.urgency_level === "string"
          ? stressUnderstanding.urgency_level
          : "medium",
      internal_summary:
        typeof stressUnderstanding.internal_summary === "string"
          ? stressUnderstanding.internal_summary.slice(0, 360)
          : "",
    },
    recommendationTags: asStringArray(payload.recommendation_tags),
    memoryCandidates: candidates,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const geminiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ error: "Server misconfigured (Supabase)" }, 500);
    }
    if (!geminiKey) {
      return jsonResponse({ error: "Server misconfigured (GEMINI_API_KEY secret)" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing Authorization Bearer token" }, 401);
    }
    const jwt = authHeader.replace("Bearer ", "");

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }
    const profileId = userData.user.id;

    const body = (await req.json()) as ClientRequest;
    const rawMessage = body.message ?? "";
    const trimmed = rawMessage.trim();
    const timezone = body.clientContext?.timezone ?? "UTC";

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("userid, email")
      .eq("id", profileId)
      .maybeSingle();

    const displayName = profileRow?.userid?.trim() || "there";

    let sessionId = body.sessionId ?? null;

    if (sessionId) {
      const { data: sess, error: se } = await supabase
        .from("checkin_sessions")
        .select("id, profile_id, status")
        .eq("id", sessionId)
        .maybeSingle();
      if (se || !sess || sess.profile_id !== profileId) {
        return jsonResponse({ error: "Session not found or access denied" }, 403);
      }
      if (sess.status === "finished") {
        return jsonResponse({ error: "Session already finished" }, 400);
      }
    } else {
      const { data: created, error: ce } = await supabase
        .from("checkin_sessions")
        .insert({ profile_id: profileId, status: "active" })
        .select("id")
        .single();
      if (ce || !created) {
        return jsonResponse({ error: "Could not create session", detail: ce?.message }, 500);
      }
      sessionId = created.id;
    }

    const { data: memoryRows } = await supabase
      .from("user_memory")
      .select("category, key, value, confidence, status")
      .eq("profile_id", profileId)
      .order("updated_at", { ascending: false })
      .limit(5);

    const memorySummary = (memoryRows ?? [])
      .map((r) => `- ${r.category}/${r.key}: ${String(r.value).slice(0, 80)}`)
      .join("\n");

    const { data: priorMessages } = await supabase
      .from("checkin_messages")
      .select("role, content, created_at")
      .eq("session_id", sessionId!)
      .order("created_at", { ascending: true })
      .limit(12);

    const prior: { role: "user" | "assistant"; content: string }[] = (priorMessages ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const bootstrapOpening = trimmed.length === 0 && prior.length === 0;
    if (trimmed.length === 0 && prior.length > 0) {
      return jsonResponse({ error: "Message cannot be empty" }, 400);
    }

    let userMessageId: string | null = null;
    if (trimmed.length > 0) {
      const { data: um, error: ume } = await supabase
        .from("checkin_messages")
        .insert({
          session_id: sessionId!,
          profile_id: profileId,
          role: "user",
          content: trimmed,
        })
        .select("id")
        .single();
      if (ume || !um) {
        return jsonResponse({ error: "Could not save user message", detail: ume?.message }, 500);
      }
      userMessageId = um.id;
    }

    const recentPrior = prior.slice(-6);
    let normalized: ReturnType<typeof normalizeModelPayload>;

    if (bootstrapOpening) {
      normalized = {
        assistantMessage:
          "Welcome back. How are you feeling inside right now?",
        shouldFinish: false,
        current: {
          stress_level: "moderate",
          mood_valence: "mixed",
          energy_level: "medium",
          confidence: 0.4,
        },
        stressUnderstanding: {
          primary_sources: [],
          secondary_sources: [],
          urgency_level: "medium",
          internal_summary: "",
        },
        recommendationTags: [],
        memoryCandidates: [],
      };
    } else {
      const turnPrompt = conversationSystemPrompt(displayName, memorySummary, timezone);
      const turnPayload = await callGeminiWithRetry(
        geminiKey,
        turnPrompt,
        buildGeminiContents(recentPrior, trimmed),
      );
      normalized = normalizeModelPayload(turnPayload);

      if (normalized.shouldFinish) {
        try {
          const finalPayload = await callGeminiWithRetry(
            geminiKey,
            finalSummarySystemPrompt(displayName, timezone),
            buildGeminiContents(recentPrior, trimmed),
          );
          const finalNormalized = normalizeModelPayload(finalPayload);
          normalized = {
            ...normalized,
            assistantMessage: finalNormalized.assistantMessage || normalized.assistantMessage,
            current: finalNormalized.current,
            stressUnderstanding: finalNormalized.stressUnderstanding,
            recommendationTags: finalNormalized.recommendationTags,
          };
        } catch (e) {
          console.warn("final summary pass failed, keeping turn output");
          normalized.shouldFinish = false;
        }
      }
    }

    const assistantMessage = normalizeAssistantMessage(normalized.assistantMessage, displayName);

    const { data: amRow, error: ame } = await supabase
      .from("checkin_messages")
      .insert({
        session_id: sessionId!,
        profile_id: profileId,
        role: "assistant",
        content: assistantMessage,
      })
      .select("id")
      .single();
    if (ame || !amRow) {
      return jsonResponse({ error: "Could not save assistant message", detail: ame?.message }, 500);
    }

    const current = normalized.current;
    const stressU = normalized.stressUnderstanding;
    const profileSig: Record<string, unknown> = {};

    await supabase.from("checkin_analysis").insert({
      session_id: sessionId!,
      message_id: amRow.id,
      profile_id: profileId,
      stress_level: current.stress_level ?? null,
      mood_valence: current.mood_valence ?? null,
      energy_level: current.energy_level ?? null,
      confidence: typeof current.confidence === "number" ? current.confidence : null,
      primary_sources: asStringArray(stressU.primary_sources),
      secondary_sources: asStringArray(stressU.secondary_sources),
      urgency_level: stressU.urgency_level ?? null,
      internal_summary: typeof stressU.internal_summary === "string"
        ? stressU.internal_summary
        : null,
      profile_signals: profileSig,
      recommendation_tags: normalized.recommendationTags,
      raw_analysis: {
        current_state: current,
        stress_understanding: stressU,
        recommendation_tags: normalized.recommendationTags,
        should_finish: normalized.shouldFinish,
      },
    });

    const candidates = normalized.memoryCandidates;
    for (const c of candidates) {
      const conf = typeof c.confidence === "number" ? c.confidence : 0;
      if (conf < 0.35) continue;
      const cat = String(c.category ?? "general");
      const key = String(c.key ?? "note");
      const val = String(c.value ?? "");
      if (!val) continue;

      await supabase.from("memory_observations").insert({
        profile_id: profileId,
        session_id: sessionId!,
        source_message_id: userMessageId ?? amRow.id,
        category: cat,
        key,
        value: val,
        confidence: conf,
      });

      if (c.save_now === true && conf >= 0.45) {
        const { data: existing } = await supabase
          .from("user_memory")
          .select("id, recurrence_count, confidence")
          .eq("profile_id", profileId)
          .eq("category", cat)
          .eq("key", key)
          .maybeSingle();

        if (existing) {
          const nextRc = (existing.recurrence_count ?? 1) + 1;
          await supabase
            .from("user_memory")
            .update({
              value: val,
              confidence: Math.min(1, Math.max(existing.confidence ?? 0, conf)),
              recurrence_count: nextRc,
              last_seen_at: new Date().toISOString(),
              status: nextRc >= 2 ? "confirmed" : "provisional",
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("user_memory").insert({
            profile_id: profileId,
            category: cat,
            key,
            value: val,
            confidence: conf,
            recurrence_count: 1,
            status: "provisional",
          });
        }
      }
    }

    const finished = normalized.shouldFinish;
    await supabase
      .from("checkin_sessions")
      .update({
        latest_stress_level: current.stress_level ?? null,
        latest_mood_valence: current.mood_valence ?? null,
        latest_confidence: typeof current.confidence === "number" ? current.confidence : null,
        status: finished ? "finished" : "active",
        ended_at: finished ? new Date().toISOString() : null,
      })
      .eq("id", sessionId!);

    const tags = normalized.recommendationTags;
    const resultScore = computeResultScore(
      current.stress_level,
      current.confidence,
    );

    return jsonResponse({
      sessionId,
      assistantMessage,
      status: finished ? "finished" : "continue",
      finalSummary: finished ? assistantMessage : null,
      uiHints: {
        showRecommendations: finished && tags.length > 0,
        resultScore: finished ? resultScore : null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("question-checkin error:", msg);
    if (msg.includes("GEMINI_HTTP_503") || msg.includes("GEMINI_HTTP_429")) {
      return jsonResponse(
        {
          error: "SERVICE_BUSY",
          detail: "Check-in is busy right now. Please try again in a moment.",
        },
        503,
      );
    }
    return jsonResponse({ error: "Internal error", detail: msg }, 500);
  }
});
