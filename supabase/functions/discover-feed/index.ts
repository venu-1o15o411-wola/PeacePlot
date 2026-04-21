import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type DiscoverCategory =
  | "all"
  | "books"
  | "video"
  | "image"
  | "music"
  | "movement"
  | "places"
  | "ai";
type DiscoverModality =
  | "book"
  | "video"
  | "music"
  | "story"
  | "yoga"
  | "tai-chi"
  | "place"
  | "ai";
type MediaType = "book" | "video" | "audio" | "image" | "text";

type DiscoverItem = {
  id: string;
  source: "seed" | "pixabay" | "gutendex" | "openverse";
  sourceItemId: string;
  category: Exclude<DiscoverCategory, "all">;
  modality: DiscoverModality;
  mediaType: MediaType;
  title: string;
  subtitle: string;
  duration: string;
  tags: string[];
  thumbUrl?: string;
  contentUrl?: string;
  contentText?: string;
  doctorBadge?: boolean;
};

type ClientRequest = {
  mode?: "featured" | "feed" | "item" | "feedback" | "warm-cache";
  category?: DiscoverCategory;
  query?: string;
  page?: number;
  pageSize?: number;
  timezone?: string;
  id?: string;
  actionType?: "open" | "save" | "hide" | "not_for_me" | "complete";
  metadata?: Record<string, unknown>;
};

type ProfileSignals = {
  stressLevel: string | null;
  moodValence: string | null;
  energyLevel: string | null;
  primarySources: string[];
  secondarySources: string[];
};

type DiscoverSupabase = ReturnType<typeof createClient>;

function normalizeCategoryCompat(
  category: string,
): Exclude<DiscoverCategory, "all"> | null {
  if (category === "media") return "video";
  if (
    category === "books" ||
    category === "video" ||
    category === "image" ||
    category === "music" ||
    category === "movement" ||
    category === "places" ||
    category === "ai"
  ) {
    return category;
  }
  return null;
}

function normalizeItemCompat(item: DiscoverItem): DiscoverItem | null {
  const nextCategory = normalizeCategoryCompat(String(item.category ?? ""));
  if (!nextCategory) return null;
  return {
    ...item,
    category: nextCategory,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function nowIso(): string {
  return new Date().toISOString();
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let s = seed || 123456789;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

function getDayKey(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizeSignals(raw: Record<string, unknown> | null): ProfileSignals {
  if (!raw) {
    return {
      stressLevel: null,
      moodValence: null,
      energyLevel: null,
      primarySources: [],
      secondarySources: [],
    };
  }
  return {
    stressLevel: typeof raw.stress_level === "string" ? raw.stress_level : null,
    moodValence: typeof raw.mood_valence === "string" ? raw.mood_valence : null,
    energyLevel: typeof raw.energy_level === "string" ? raw.energy_level : null,
    primarySources: Array.isArray(raw.primary_sources)
      ? raw.primary_sources.map((x) => String(x))
      : [],
    secondarySources: Array.isArray(raw.secondary_sources)
      ? raw.secondary_sources.map((x) => String(x))
      : [],
  };
}

function categoryWeights(signals: ProfileSignals): Record<Exclude<DiscoverCategory, "all">, number> {
  const w: Record<Exclude<DiscoverCategory, "all">, number> = {
    books: 1,
    video: 1,
    image: 1,
    music: 1,
    movement: 1,
    places: 1,
    ai: 1,
  };
  if (!signals.stressLevel) return w;
  if (signals.stressLevel === "high" || signals.stressLevel === "elevated") {
    w.music += 0.7;
    w.movement += 0.6;
    w.places += 0.5;
    w.ai += 0.4;
    w.books -= 0.1;
  } else if (signals.stressLevel === "mild" || signals.stressLevel === "low") {
    w.books += 0.45;
    w.video += 0.35;
    w.image += 0.15;
    w.places += 0.2;
  }
  if (signals.energyLevel === "low") {
    w.music += 0.3;
    w.video += 0.2;
    w.movement -= 0.2;
  } else if (signals.energyLevel === "high") {
    w.movement += 0.4;
  }
  if (signals.primarySources.some((x) => x.includes("overthinking"))) {
    w.music += 0.35;
    w.places += 0.2;
  }
  return w;
}

function itemScore(
  item: DiscoverItem,
  weights: Record<Exclude<DiscoverCategory, "all">, number>,
  query: string,
  seedRng: () => number,
): number {
  const q = query.trim().toLowerCase();
  const blob = `${item.title} ${item.subtitle} ${item.tags.join(" ")}`.toLowerCase();
  const queryBoost = q && blob.includes(q) ? 0.9 : q ? -0.2 : 0;
  const base = weights[item.category] ?? 1;
  const badgeBoost = item.doctorBadge ? 0.1 : 0;
  const jitter = seedRng() * 0.25;
  return base + queryBoost + badgeBoost + jitter;
}

function formatDuration(mins: number, kind: "read" | "watch" | "listen" | "move" | "tips"): string {
  if (kind === "tips") return "Map + tips";
  if (kind === "read") return `${mins} min read`;
  return `${mins} min`;
}

const SAMPLE_VIDEO = [
  "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
];
const SAMPLE_AUDIO = [
  "https://samplelib.com/lib/preview/mp3/sample-3s.mp3",
  "https://samplelib.com/lib/preview/mp3/sample-6s.mp3",
  "https://samplelib.com/lib/preview/mp3/sample-9s.mp3",
  "https://samplelib.com/lib/preview/mp3/sample-12s.mp3",
];
const SAMPLE_IMAGE = (seed: number) => `https://picsum.photos/seed/pp-discover-${seed}/640/420`;

function makeSeedCatalog(): DiscoverItem[] {
  const out: DiscoverItem[] = [];
  const bookThemes = ["Calm", "Warm", "Peaceful", "Romantic", "Lovely", "Reflective", "Happy", "Family"];
  const mediaThemes = ["Ocean", "Forest", "Sunset", "Rain", "Night Sky", "Riverside"];
  const musicThemes = ["Piano", "Ambient", "Lo-fi", "Nature", "Acoustic", "Soft Strings"];
  const movementThemes = ["Gentle Yoga", "Breath Flow", "Tai Chi", "Shoulder Reset", "Neck Release"];
  const placesThemes = ["Garden Walk", "Lakeside", "Quiet Park", "Hill Overlook", "Riverside Path"];
  const aiThemes = ["Reframe the spike", "One gentle step", "Tiny reset", "Night easing"];

  for (let i = 0; i < 28; i += 1) {
    out.push({
      id: `seed:book:${i}`,
      source: "seed",
      sourceItemId: `book-${i}`,
      category: "books",
      modality: "book",
      mediaType: "book",
      title: `${bookThemes[i % bookThemes.length]} Reading ${i + 1}`,
      subtitle: "Short book excerpt for steady attention",
      duration: formatDuration(8 + (i % 20), "read"),
      tags: ["calm", "book"],
      thumbUrl: SAMPLE_IMAGE(1000 + i),
      contentUrl: "https://www.gutenberg.org/files/1342/1342-0.txt",
      contentText: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
      doctorBadge: i % 7 === 0,
    });
    out.push({
      id: `seed:media:${i}`,
      source: "seed",
      sourceItemId: `media-${i}`,
      category: "video",
      modality: i % 3 === 0 ? "story" : "video",
      mediaType: "video",
      title: `${mediaThemes[i % mediaThemes.length]} Visual ${i + 1}`,
      subtitle: "Soft visual sequence for decompression",
      duration: formatDuration(5 + (i % 18), "watch"),
      tags: ["calm", "visual"],
      thumbUrl: SAMPLE_IMAGE(2000 + i),
      contentUrl: SAMPLE_VIDEO[i % SAMPLE_VIDEO.length],
    });
    out.push({
      id: `seed:music:${i}`,
      source: "seed",
      sourceItemId: `music-${i}`,
      category: "music",
      modality: "music",
      mediaType: "audio",
      title: `${musicThemes[i % musicThemes.length]} Loop ${i + 1}`,
      subtitle: "Gentle audio for focus and calm",
      duration: formatDuration(7 + (i % 16), "listen"),
      tags: ["music", "relax"],
      thumbUrl: SAMPLE_IMAGE(3000 + i),
      contentUrl: SAMPLE_AUDIO[i % SAMPLE_AUDIO.length],
    });
    out.push({
      id: `seed:movement:${i}`,
      source: "seed",
      sourceItemId: `movement-${i}`,
      category: "movement",
      modality: i % 2 === 0 ? "yoga" : "tai-chi",
      mediaType: "video",
      title: `${movementThemes[i % movementThemes.length]} ${i + 1}`,
      subtitle: "Slow movement and breath for regulation",
      duration: formatDuration(6 + (i % 15), "move"),
      tags: ["movement", "breath"],
      thumbUrl: SAMPLE_IMAGE(4000 + i),
      contentUrl: SAMPLE_VIDEO[i % SAMPLE_VIDEO.length],
    });
    out.push({
      id: `seed:places:${i}`,
      source: "seed",
      sourceItemId: `places-${i}`,
      category: "places",
      modality: "place",
      mediaType: "image",
      title: `${placesThemes[i % placesThemes.length]} ${i + 1}`,
      subtitle: "Nearby inspiration and calming route idea",
      duration: formatDuration(0, "tips"),
      tags: ["places", "nature"],
      thumbUrl: SAMPLE_IMAGE(5000 + i),
      contentUrl: SAMPLE_IMAGE(6000 + i),
    });
    out.push({
      id: `seed:ai:${i}`,
      source: "seed",
      sourceItemId: `ai-${i}`,
      category: "ai",
      modality: "ai",
      mediaType: "text",
      title: `${aiThemes[i % aiThemes.length]} ${i + 1}`,
      subtitle: "AI support card for check-in follow-through",
      duration: formatDuration(1 + (i % 4), "read"),
      tags: ["ai", "advice"],
      thumbUrl: SAMPLE_IMAGE(7000 + i),
      contentText: "Take one gentle breath. Name what you feel. Pick one tiny next step for the next ten minutes.",
    });
  }
  return out;
}

async function fetchGutendex(query: string, page: number): Promise<DiscoverItem[]> {
  const u = new URL("https://gutendex.com/books");
  if (query.trim()) u.searchParams.set("search", query.trim());
  else u.searchParams.set("topic", "calm");
  u.searchParams.set("languages", "en");
  u.searchParams.set("page", String(page));
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 4000);
  try {
    const res = await fetch(u.toString(), { signal: ac.signal });
    if (!res.ok) return [];
    const body = await res.json() as {
      results?: Array<{
        id: number;
        title: string;
        subjects?: string[];
        download_count?: number;
        formats?: Record<string, string>;
      }>;
    };
    return (body.results ?? []).slice(0, 20).map((b, i) => ({
      id: `gutendex:${b.id}`,
      source: "gutendex",
      sourceItemId: String(b.id),
      category: "books",
      modality: "book",
      mediaType: "book",
      title: b.title || `Book ${i + 1}`,
      subtitle: (b.subjects ?? []).slice(0, 2).join(" · ") || "Public domain literature",
      duration: `${15 + (i % 20)} min read`,
      tags: ["book", "gutenberg"],
      doctorBadge: (b.download_count ?? 0) > 6000,
      contentUrl:
        b.formats?.["text/plain; charset=utf-8"] ??
        b.formats?.["text/plain"] ??
        b.formats?.["text/html; charset=utf-8"] ??
        undefined,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

async function fetchPixabayMedia(apiKey: string, query: string, page: number, kind: "media" | "places"): Promise<DiscoverItem[]> {
  const endpoint = kind === "media" ? "https://pixabay.com/api/videos/" : "https://pixabay.com/api/";
  const u = new URL(endpoint);
  u.searchParams.set("key", apiKey);
  u.searchParams.set("q", query || (kind === "places" ? "nature landscape" : "calm nature"));
  u.searchParams.set("safesearch", "true");
  u.searchParams.set("page", String(page));
  u.searchParams.set("per_page", "20");
  if (kind === "places") {
    u.searchParams.set("category", "places");
    u.searchParams.set("image_type", "photo");
    u.searchParams.set("orientation", "horizontal");
  }
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 4500);
  try {
    const res = await fetch(u.toString(), { signal: ac.signal });
    if (!res.ok) return [];
    const body = await res.json() as { hits?: Array<Record<string, unknown>> };
    return (body.hits ?? []).slice(0, 20).map((h, i) => {
      const id = String(h.id ?? `p-${i}`);
      const title = String(h.tags ?? `${kind} ${i + 1}`).split(",")[0].trim();
      if (kind === "media") {
        const videos = (h.videos ?? {}) as Record<string, { url?: string }>;
        const candidates = [
          videos.medium?.url,
          videos.large?.url,
          videos.small?.url,
          videos.tiny?.url,
        ].filter((v): v is string => typeof v === "string" && v.startsWith("http"));
        // iOS/WebView is much more reliable with MP4 endpoints than WebM.
        const contentUrl =
          candidates.find((u) => u.toLowerCase().includes(".mp4")) ??
          candidates[0] ??
          undefined;
        const pictureId =
          typeof h.picture_id === "string" && h.picture_id.trim().length > 0
            ? h.picture_id.trim()
            : undefined;
        const thumbUrl = pictureId
          ? `https://i.vimeocdn.com/video/${pictureId}_640x360.jpg`
          : undefined;
        return {
          id: `pixabay:video:${id}`,
          source: "pixabay",
          sourceItemId: id,
          category: "video",
          modality: "video",
          mediaType: "video",
          title: title || `Calm video ${i + 1}`,
          subtitle: "Pixabay visual loop",
          duration: `${4 + (i % 10)} min`,
          tags: ["pixabay", "video"],
          thumbUrl,
          contentUrl,
        } satisfies DiscoverItem;
      }
      return {
        id: `pixabay:image:${id}`,
        source: "pixabay",
        sourceItemId: id,
        category: "places",
        modality: "place",
        mediaType: "image",
        title: title || `Place ${i + 1}`,
        subtitle: "Scenic visual from Pixabay",
        duration: "Map + tips",
        tags: ["pixabay", "places"],
        thumbUrl: typeof h.webformatURL === "string" ? h.webformatURL : undefined,
        contentUrl: typeof h.largeImageURL === "string" ? h.largeImageURL : undefined,
      } satisfies DiscoverItem;
    });
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

const MUSIC_BANNED_TERMS = [
  "sfx",
  "sound effect",
  "effect",
  "fx",
  "foley",
  "whoosh",
  "hit",
  "impact",
  "explosion",
  "alarm",
  "ringtone",
  "notification",
  "glitch",
  "noise",
  "beep",
  "ui",
  "button",
  "cinematic riser",
  "trailer",
];

const SPEECH_INDICATORS = [
  "talk",
  "speech",
  "interview",
  "podcast",
  "episode",
  "narration",
  "lecture",
  "discussion",
  "news",
  "commentary",
  "audiobook",
  "spoken word",
  "sermon",
  "debate",
];
const SPEECH_INDICATOR_SET = new Set(SPEECH_INDICATORS);

const ALLOWED_MUSIC_GENRES = [
  "electronic",
  "ambient",
  "classical",
  "instrumental",
  "jazz",
  "lofi",
  "lo-fi",
  "chillout",
  "chill",
  "soundtrack",
  "experimental",
];
const ALLOWED_MUSIC_GENRE_SET = new Set(ALLOWED_MUSIC_GENRES);

const BLOCKED_GENRES = [
  "spoken",
  "podcast",
  "radio",
  "interview",
  "audiobook",
  "news",
];
const BLOCKED_GENRE_SET = new Set(BLOCKED_GENRES);

const TAG_NORMALIZATION: Record<string, string> = {
  ambient: "calm",
  meditation: "calm",
  focus: "productivity",
  sleep: "sleep",
  "dark ambient": "deep_relax",
  calm: "calm",
  chill: "calm",
  chillout: "calm",
  instrumental: "music",
  classical: "music",
  jazz: "music",
  lofi: "music",
  "lo-fi": "music",
};

function isLikelyRelaxingMusic(title: string, artist: string): boolean {
  const blob = `${title} ${artist}`.toLowerCase();
  return !MUSIC_BANNED_TERMS.some((t) => blob.includes(t));
}

function textBlobForTrack(
  title: string,
  artist: string,
  description: string,
  tags: string[],
  genres: string[],
): string {
  return [title, artist, description, ...tags, ...genres].join(" ").toLowerCase();
}

function containsSpeechIndicators(blob: string): boolean {
  for (const w of SPEECH_INDICATOR_SET) {
    if (blob.includes(w)) return true;
  }
  return false;
}

function hasBlockedGenre(genres: string[]): boolean {
  for (const raw of genres) {
    const g = raw.toLowerCase();
    for (const blocked of BLOCKED_GENRE_SET) {
      if (g.includes(blocked)) return true;
    }
  }
  return false;
}

function hasAllowedGenre(genres: string[], blob: string): boolean {
  if (genres.length === 0) {
    // Openverse/FMA often omits genre metadata; don't hard-fail on missing fields.
    return true;
  }
  for (const raw of genres) {
    const g = raw.toLowerCase();
    for (const allowed of ALLOWED_MUSIC_GENRE_SET) {
      if (g.includes(allowed)) return true;
    }
  }
  // FMA/Openverse metadata can be sparse, so allow genre inference from text fields.
  for (const allowed of ALLOWED_MUSIC_GENRE_SET) {
    if (blob.includes(allowed)) return true;
  }
  return false;
}

function normalizeTags(tags: string[], genres: string[]): string[] {
  const out = new Set<string>(["music", "pixabay"]);
  const merged = [...tags, ...genres];
  for (const raw of merged) {
    const k = raw.trim().toLowerCase();
    if (!k) continue;
    out.add(k);
    if (TAG_NORMALIZATION[k]) out.add(TAG_NORMALIZATION[k]);
  }
  return Array.from(out);
}

function isSupportedAudioUrl(url: string): boolean {
  const clean = url.toLowerCase().split("?")[0];
  if (
    clean.endsWith(".mp3") ||
    clean.endsWith(".m4a") ||
    clean.endsWith(".aac") ||
    clean.endsWith(".wav")
  ) return true;
  try {
    const u = new URL(url);
    const format = (u.searchParams.get("format") ?? "").toLowerCase();
    if (format.includes("mp3") || format.includes("mp32") || format.includes("m4a") || format.includes("aac")) {
      return true;
    }
    if (u.hostname.includes("storage.jamendo.com")) return true;
  } catch {
    // ignore URL parse errors and fall through
  }
  return false;
}

function parseDurationSeconds(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.max(0, raw);
    // Openverse commonly returns duration in milliseconds for some sources.
    return n > 10000 ? Math.round(n / 1000) : n;
  }
  if (typeof raw !== "string") return 0;
  const v = raw.trim();
  if (!v) return 0;
  const direct = Number(v);
  if (Number.isFinite(direct)) return Math.max(0, direct);
  const parts = v.split(":").map((p) => Number(p));
  if (parts.some((p) => !Number.isFinite(p) || p < 0)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

async function fetchPixabayMusic(apiKey: string, query: string, page: number): Promise<DiscoverItem[]> {
  const u = new URL("https://pixabay.com/api/audio/");
  u.searchParams.set("key", apiKey);
  u.searchParams.set("page", String(page));
  u.searchParams.set("per_page", "50");
  u.searchParams.set("order", "popular");
  u.searchParams.set("q", query.trim() || "meditation calm piano relaxing ambient");
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 6000);
  try {
    const res = await fetch(u.toString(), { signal: ac.signal });
    if (!res.ok) return [];
    const body = await res.json() as {
      results?: Array<{
        id?: string | number;
        title?: string;
        creator?: string;
        user?: string;
        type?: string;
        tags?: string;
        duration?: number | string;
        audio?: {
          low?: string;
          medium?: string;
          high?: string;
        };
      }>;
      hits?: Array<{
        id?: string | number;
        title?: string;
        user?: string;
        type?: string;
        tags?: string;
        duration?: number | string;
        audio?: {
          low?: string;
          medium?: string;
          high?: string;
        };
      }>;
    };
    const hits = Array.isArray(body.hits) ? body.hits : Array.isArray(body.results) ? body.results : [];
    const out: DiscoverItem[] = [];
    const fallback: DiscoverItem[] = [];
    const seen = new Set<string>();
    for (const [i, r] of hits.entries()) {
      if (typeof r.type === "string" && r.type.toLowerCase() !== "music") continue;
      const contentUrl =
        typeof r.audio?.high === "string" && r.audio.high.startsWith("http")
          ? r.audio.high
          : typeof r.audio?.medium === "string" && r.audio.medium.startsWith("http")
            ? r.audio.medium
            : typeof r.audio?.low === "string" && r.audio.low.startsWith("http")
              ? r.audio.low
              : "";
      if (!contentUrl.startsWith("http") || seen.has(contentUrl)) continue;
      if (!isSupportedAudioUrl(contentUrl)) continue;
      const durationSec = parseDurationSeconds(r.duration);
      // Keep 2-10 min rule when duration is known, but allow unknown duration metadata.
      if (durationSec > 0 && (durationSec < 120 || durationSec > 600)) continue;
      const title = String(r.title ?? "").trim() || `Pixabay Track ${i + 1}`;
      const artist = String(r.user ?? "").trim();
      const tags = String(r.tags ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      const genres = tags;
      const blob = textBlobForTrack(title, artist, "", tags, genres);
      const baseItem: DiscoverItem = {
        id: `pixabay:audio:${r.id ?? `${page}-${i}`}`,
        source: "pixabay",
        sourceItemId: String(r.id ?? `${page}-${i}`),
        category: "music",
        modality: "music",
        mediaType: "audio",
        title,
        subtitle: artist ? `By ${artist}` : "Pixabay music track",
        duration: `${Math.max(1, Math.round((durationSec || 180) / 60))} min`,
        tags: normalizeTags(tags, genres),
        contentUrl,
      };
      // Keep a softer fallback candidate (music type + duration + no speech).
      if (!containsSpeechIndicators(blob)) {
        fallback.push(baseItem);
      }
      // Multi-layer filtering: genre gate -> speech detection -> quality filter.
      if (hasBlockedGenre(genres)) continue;
      if (!hasAllowedGenre(genres, blob)) continue;
      if (containsSpeechIndicators(blob)) continue;
      if (!isLikelyRelaxingMusic(title, artist)) continue;
      seen.add(contentUrl);
      out.push(baseItem);
      if (out.length >= 25) break;
    }
    if (out.length > 0) return out;
    const dedupedFallback: DiscoverItem[] = [];
    const fallbackSeen = new Set<string>();
    for (const item of fallback) {
      if (!item.contentUrl || fallbackSeen.has(item.contentUrl)) continue;
      fallbackSeen.add(item.contentUrl);
      dedupedFallback.push(item);
      if (dedupedFallback.length >= 25) break;
    }
    return dedupedFallback;
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

async function fetchOpenverseJamendoMusic(query: string, page: number): Promise<DiscoverItem[]> {
  const u = new URL("https://api.openverse.org/v1/audio/");
  u.searchParams.set("source", "jamendo");
  u.searchParams.set("page_size", "80");
  u.searchParams.set("page", String(page));
  u.searchParams.set("q", query.trim() || "calm ambient instrumental focus meditation");
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 6000);
  try {
    const res = await fetch(u.toString(), { signal: ac.signal });
    if (!res.ok) return [];
    const body = await res.json() as {
      results?: Array<{
        id?: string;
        title?: string;
        creator?: string;
        category?: string;
        genres?: string[] | string;
        tags?: Array<string | { name?: string }> | string;
        description?: string;
        duration?: number | string;
        url?: string;
        audio_url?: string;
        thumbnail?: string;
      }>;
    };
    const out: DiscoverItem[] = [];
    const fallback: DiscoverItem[] = [];
    const seen = new Set<string>();
    for (const [i, r] of (body.results ?? []).entries()) {
      const contentUrl = typeof r.audio_url === "string"
        ? r.audio_url
        : typeof r.url === "string"
          ? r.url
          : "";
      if (!contentUrl.startsWith("http") || seen.has(contentUrl)) continue;
      if (!isSupportedAudioUrl(contentUrl)) continue;
      const durationSec = parseDurationSeconds(r.duration);
      if (durationSec > 0 && (durationSec < 120 || durationSec > 600)) continue;
      const title = String(r.title ?? "").trim() || `Jamendo Track ${i + 1}`;
      const artist = String(r.creator ?? "").trim();
      const description = String(r.description ?? "").trim();
      const category = String(r.category ?? "").trim().toLowerCase();
      const genres = Array.isArray(r.genres)
        ? r.genres.map((g) => String(g))
        : typeof r.genres === "string"
          ? [r.genres]
          : category
            ? [category]
            : [];
      const tags = Array.isArray(r.tags)
        ? r.tags.map((t) => (typeof t === "string" ? t : String(t?.name ?? ""))).filter(Boolean)
        : typeof r.tags === "string"
          ? r.tags.split(",").map((x) => x.trim()).filter(Boolean)
          : [];
      const blob = textBlobForTrack(title, artist, description, tags, genres);
      const baseItem: DiscoverItem = {
        id: `openverse:jamendo:${r.id ?? `${page}-${i}`}`,
        source: "openverse",
        sourceItemId: String(r.id ?? `${page}-${i}`),
        category: "music",
        modality: "music",
        mediaType: "audio",
        title,
        subtitle: artist ? `By ${artist}` : "Jamendo track",
        duration: `${Math.max(1, Math.round((durationSec || 180) / 60))} min`,
        tags: normalizeTags(tags, genres),
        thumbUrl: typeof r.thumbnail === "string" ? r.thumbnail : undefined,
        contentUrl,
      };
      if (!containsSpeechIndicators(blob)) {
        fallback.push(baseItem);
      }
      if (hasBlockedGenre(genres)) continue;
      if (!hasAllowedGenre(genres, blob)) continue;
      if (containsSpeechIndicators(blob)) continue;
      if (!isLikelyRelaxingMusic(title, artist)) continue;
      seen.add(contentUrl);
      out.push(baseItem);
      if (out.length >= 25) break;
    }
    if (out.length > 0) return out;
    const dedupedFallback: DiscoverItem[] = [];
    const fallbackSeen = new Set<string>();
    for (const item of fallback) {
      if (!item.contentUrl || fallbackSeen.has(item.contentUrl)) continue;
      fallbackSeen.add(item.contentUrl);
      dedupedFallback.push(item);
      if (dedupedFallback.length >= 25) break;
    }
    return dedupedFallback;
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

async function fetchGutendexCached(
  supabase: DiscoverSupabase,
  query: string,
  page: number,
): Promise<DiscoverItem[]> {
  void supabase;
  return fetchGutendex(query, page);
}

async function fetchPixabayCached(
  supabase: DiscoverSupabase,
  apiKey: string,
  query: string,
  page: number,
  kind: "media" | "places",
): Promise<DiscoverItem[]> {
  void supabase;
  return fetchPixabayMedia(apiKey, query, page, kind);
}

async function fetchPixabayMusicCached(
  supabase: DiscoverSupabase,
  apiKey: string,
  query: string,
  page: number,
): Promise<DiscoverItem[]> {
  void supabase;
  return fetchPixabayMusic(apiKey, query, page);
}

async function fetchOpenverseMusicCached(
  supabase: DiscoverSupabase,
  query: string,
  page: number,
): Promise<DiscoverItem[]> {
  void supabase;
  return fetchOpenverseJamendoMusic(query, page);
}

async function loadSignals(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
): Promise<ProfileSignals> {
  const { data } = await supabase
    .from("checkin_analysis")
    .select("stress_level, mood_valence, energy_level, primary_sources, secondary_sources, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return normalizeSignals((data ?? null) as Record<string, unknown> | null);
}

function dedupe(items: DiscoverItem[]): DiscoverItem[] {
  const seen = new Set<string>();
  const out: DiscoverItem[] = [];
  for (const x of items) {
    if (seen.has(x.id)) continue;
    seen.add(x.id);
    out.push(x);
  }
  return out;
}

function hasRenderableMedia(item: DiscoverItem): boolean {
  if (item.mediaType === "text") return true;
  if (item.mediaType === "book") return Boolean(item.contentUrl || item.contentText);
  if (item.mediaType === "image") return Boolean(item.contentUrl || item.thumbUrl);
  if (item.mediaType === "audio" || item.mediaType === "video") return Boolean(item.contentUrl);
  return false;
}


function pickDailyFeatured(
  pool: DiscoverItem[],
  profileId: string,
  dayKey: string,
  weights: Record<Exclude<DiscoverCategory, "all">, number>,
): DiscoverItem[] {
  const rr = rng(hashString(`${profileId}:${dayKey}:featured`));
  const by = {
    video: pool.filter((x) => x.modality === "video"),
    music: pool.filter((x) => x.modality === "music"),
    book: pool.filter((x) => x.modality === "book"),
    movement: pool.filter((x) => x.category === "movement"),
    place: pool.filter((x) => x.modality === "place"),
  };
  const choose = (arr: DiscoverItem[]) =>
    [...arr]
      .sort((a, b) => itemScore(b, weights, "", rr) - itemScore(a, weights, "", rr))
      .slice(0, 8)[Math.floor(rr() * Math.min(8, arr.length))] ?? null;
  return dedupe([choose(by.video), choose(by.music), choose(by.book), choose(by.movement), choose(by.place)].filter(Boolean) as DiscoverItem[]);
}

function mapCategory(item: DiscoverItem, category: DiscoverCategory): boolean {
  if (category === "all") return true;
  if (category === "books") return item.category === "books";
  if (category === "video") {
    return item.category === "video" || item.mediaType === "video" || item.modality === "video" || item.modality === "story";
  }
  if (category === "image") {
    return item.category === "image" || item.mediaType === "image" || item.modality === "place";
  }
  if (category === "music") return item.category === "music";
  if (category === "movement") return item.category === "movement";
  if (category === "places") return item.category === "places";
  if (category === "ai") return item.category === "ai";
  return true;
}

function blendAll(
  items: DiscoverItem[],
  page: number,
  pageSize: number,
  query: string,
  weights: Record<Exclude<DiscoverCategory, "all">, number>,
  seedKey: string,
): DiscoverItem[] {
  const rr = rng(hashString(seedKey));
  const buckets: Record<Exclude<DiscoverCategory, "all">, DiscoverItem[]> = {
    books: [],
    video: [],
    image: [],
    music: [],
    movement: [],
    places: [],
    ai: [],
  };
  for (const x of items) {
    const normalized = normalizeItemCompat(x);
    if (!normalized) continue;
    buckets[normalized.category].push(normalized);
  }
  const sorted = Object.fromEntries(
    (Object.keys(buckets) as Array<Exclude<DiscoverCategory, "all">>).map((k) => [
      k,
      buckets[k].sort((a, b) => itemScore(b, weights, query, rr) - itemScore(a, weights, query, rr)),
    ]),
  ) as Record<Exclude<DiscoverCategory, "all">, DiscoverItem[]>;

  const merged: DiscoverItem[] = [];
  const order: Array<Exclude<DiscoverCategory, "all">> = ["video", "music", "books", "movement", "image", "places", "ai"];
  let pass = 0;
  while (merged.length < 500) {
    let pushed = false;
    for (const c of order) {
      const idx = pass;
      if (sorted[c][idx]) {
        merged.push(sorted[c][idx]);
        pushed = true;
      }
    }
    if (!pushed) break;
    pass += 1;
  }
  return merged.slice(0, pageSize);
}

function ensurePageSizeFromPool(
  items: DiscoverItem[],
  pool: DiscoverItem[],
  pageSize: number,
): DiscoverItem[] {
  if (items.length >= pageSize) return dedupe(items).slice(0, pageSize);
  const seen = new Set(items.map((x) => x.id));
  const out = [...items];
  for (const x of pool) {
    if (seen.has(x.id)) continue;
    seen.add(x.id);
    out.push(x);
    if (out.length >= pageSize) break;
  }
  return dedupe(out).slice(0, pageSize);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ error: "Server misconfigured (Supabase)." }, 500);
    }
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const authHeader = req.headers.get("Authorization");
    let profileId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const jwt = authHeader.replace("Bearer ", "");
      const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
      if (!userErr && userData.user) {
        profileId = userData.user.id;
      }
    }
    const body = (await req.json()) as ClientRequest;
    const mode = body.mode ?? "feed";
    const category = (body.category ?? "all") as DiscoverCategory;
    const query = (body.query ?? "").trim();
    const page = Math.max(1, Number(body.page ?? 1));
    const pageSizeRequested = Math.max(15, Number(body.pageSize ?? 15));
    const pageSize = clamp(pageSizeRequested, 15, 40);
    const timezone = body.timezone || "UTC";
    const dayKey = getDayKey(timezone);

    if (mode === "feedback") {
      if (!profileId) {
        return jsonResponse({ error: "Sign in required for feedback." }, 401);
      }
      const itemId = String(body.id ?? "").trim();
      const actionType = body.actionType;
      if (!itemId || !actionType) {
        return jsonResponse({ error: "id and actionType are required" }, 400);
      }
      await supabase.from("discover_user_feedback").insert({
        profile_id: profileId,
        item_uid: itemId,
        action_type: actionType,
        metadata: body.metadata ?? {},
      });
      return jsonResponse({ ok: true });
    }

    if (mode === "warm-cache") {
      return jsonResponse({ ok: true, warmedCount: 0, liveOnly: true });
    }

    const signals = profileId
      ? await loadSignals(supabase, profileId)
      : { stressLevel: null, moodValence: null, energyLevel: null, primarySources: [], secondarySources: [] };
    const weights = categoryWeights(signals);
    let pool: DiscoverItem[] = makeSeedCatalog();
    const pixabayKey = Deno.env.get("PIXABAY_API_KEY");
    const loadExternalPage = async (sourcePage: number) => {
      const needBooks = mode === "featured" || category === "all" || category === "books";
      const needMedia = mode === "featured" || category === "all" || category === "video" || category === "image";
      const needPlaces = mode === "featured" || category === "all" || category === "places";
      const needMusic = mode === "featured" || category === "all" || category === "music";
      const needMovement = mode === "featured" || category === "all" || category === "movement";
      const musicFetches: Promise<DiscoverItem[]>[] = [];
      if (needMusic) {
        if (pixabayKey) {
          musicFetches.push(fetchPixabayMusicCached(supabase, pixabayKey, query, sourcePage));
        }
        musicFetches.push(fetchOpenverseMusicCached(supabase, query, sourcePage));
      }
      const [booksExt, mediaExt, placesExt, movementExt, ...musicParts] = await Promise.all([
        needBooks ? fetchGutendexCached(supabase, query, sourcePage) : Promise.resolve([] as DiscoverItem[]),
        needMedia && pixabayKey
          ? fetchPixabayCached(supabase, pixabayKey, query, sourcePage, "media")
          : Promise.resolve([] as DiscoverItem[]),
        needPlaces && pixabayKey
          ? fetchPixabayCached(supabase, pixabayKey, query, sourcePage, "places")
          : Promise.resolve([] as DiscoverItem[]),
        needMovement && pixabayKey
          ? fetchPixabayCached(supabase, pixabayKey, `${query} yoga tai chi`, sourcePage, "media")
          : Promise.resolve([] as DiscoverItem[]),
        ...musicFetches,
      ]);
      const musicExt = dedupe(musicParts.flat());
      const movementMapped = movementExt.map((x, i) => ({
        ...x,
        id: `pixabay:movement:${x.sourceItemId}:${sourcePage}:${i}`,
        category: "movement" as const,
        modality: i % 2 === 0 ? "yoga" as const : "tai-chi" as const,
        subtitle: "Guided movement visual from Pixabay",
      }));
      return { booksExt, mediaExt, placesExt, musicExt, movementMapped };
    };
    const {
      booksExt,
      mediaExt,
      placesExt,
      musicExt,
      movementMapped,
    } = await loadExternalPage(page);
    const aiExt: DiscoverItem[] = Array.from({ length: 20 }).map((_, i) => ({
      id: `ai:${dayKey}:${page}:${i}`,
      source: "seed",
      sourceItemId: `${dayKey}-${page}-${i}`,
      category: "ai",
      modality: "ai",
      mediaType: "text",
      title: ["One gentle step", "Reframe the spike", "Tiny calm reset", "Soft focus plan"][i % 4],
      subtitle: "Personalized AI advice card",
      duration: `${1 + (i % 4)} min read`,
      tags: ["ai", "advice"],
      contentText: "Pause. Name what you feel. Choose one tiny next action for the next ten minutes.",
    }));
    pool = dedupe(pool.concat(booksExt, mediaExt, placesExt, musicExt, movementMapped, aiExt))
      .map(normalizeItemCompat)
      .filter(Boolean)
      .filter((x) => hasRenderableMedia(x as DiscoverItem)) as DiscoverItem[];
    if (mode === "feed") {
      const minimumNeeded = page * pageSize;
      let attempts = 0;
      let sourcePage = page + 1;
      while (attempts < 10) {
        const categoryPoolRaw = pool.filter((x) => mapCategory(x, category));
        const categoryPoolNonSeed = categoryPoolRaw.filter((x) => x.source !== "seed");
        const categoryPool =
          category === "ai"
            ? categoryPoolRaw
            : category === "music"
              ? categoryPoolNonSeed
              : categoryPoolNonSeed.length >= pageSize
                ? categoryPoolNonSeed
                : categoryPoolRaw;
        if (categoryPool.length >= minimumNeeded) break;
        const extra = await loadExternalPage(sourcePage);
        pool = dedupe(
          pool.concat(extra.booksExt, extra.mediaExt, extra.placesExt, extra.musicExt, extra.movementMapped),
        )
          .map(normalizeItemCompat)
          .filter(Boolean)
          .filter((x) => hasRenderableMedia(x as DiscoverItem)) as DiscoverItem[];
        sourcePage += 1;
        attempts += 1;
      }
    }
    if (mode === "item") {
      const id = body.id ?? "";
      const item = pool.find((x) => x.id === id);
      if (!item) return jsonResponse({ error: "Item not found" }, 404);
      return jsonResponse({ item });
    }

    if (mode === "featured") {
      const analysisSignature = `${signals.stressLevel ?? "none"}:${signals.moodValence ?? "none"}:${signals.energyLevel ?? "none"}`;
      const profileKey = profileId ?? "anon";
      if (profileId) {
        const { data: existing } = await supabase
          .from("discover_daily_featured")
          .select("id, items_json, analysis_signature")
          .eq("profile_id", profileId)
          .eq("day_key", dayKey)
          .maybeSingle();
        if (
          existing?.id &&
          existing.analysis_signature === analysisSignature &&
          Array.isArray(existing.items_json) &&
          existing.items_json.length >= 5
        ) {
          return jsonResponse({ items: existing.items_json, dayKey, personalized: Boolean(signals.stressLevel) });
        }
      }
      const nonSeedPool = pool.filter((x) => x.source !== "seed");
      const featuredBase = nonSeedPool.length >= 5 ? nonSeedPool : pool;
      const selected = pickDailyFeatured(featuredBase, profileKey, dayKey, weights).slice(0, 5);
      if (profileId) {
        await supabase
          .from("discover_daily_featured")
          .upsert({
            profile_id: profileId,
            day_key: dayKey,
            timezone,
            items_json: selected,
            analysis_signature: analysisSignature,
          }, { onConflict: "profile_id,day_key" });
      }
      return jsonResponse({ items: selected, dayKey, personalized: Boolean(signals.stressLevel) });
    }

    const categoryPoolRaw = pool.filter((x) => mapCategory(x, category));
    const categoryPoolNonSeed = categoryPoolRaw.filter((x) => x.source !== "seed");
    const categoryPool =
      category === "ai"
        ? categoryPoolRaw
        : category === "music"
          ? (categoryPoolNonSeed.length > 0 ? categoryPoolNonSeed : categoryPoolRaw)
        : categoryPoolNonSeed.length >= pageSize
          ? categoryPoolNonSeed
          : categoryPoolRaw;
    let items: DiscoverItem[] = [];
    if (category === "all") {
      items = blendAll(
        categoryPool,
        page,
        pageSize,
        query,
        weights,
        `${profileId}:${dayKey}:${query}:all:${page}`,
      );
    } else {
      const rr = rng(hashString(`${profileId ?? "anon"}:${dayKey}:${category}:${query}:${page}`));
      const sorted = [...categoryPool].sort(
        (a, b) => itemScore(b, weights, query, rr) - itemScore(a, weights, query, rr),
      );
      const start = (page - 1) * pageSize;
      items = sorted.slice(start, start + pageSize);
    }
    const total = categoryPool.length;
    const dedupedItems = dedupe(items);
    const hasMore = page * pageSize < total || dedupedItems.length >= pageSize;
    const musicDebug = category === "music"
      ? {
          poolTotal: total,
          pageReturned: dedupedItems.length,
          sourceCounts: {
            pixabay: categoryPool.filter((x) => x.source === "pixabay").length,
            openverse: categoryPool.filter((x) => x.source === "openverse").length,
            seed: categoryPool.filter((x) => x.source === "seed").length,
          },
        }
      : undefined;
    return jsonResponse({
      items: dedupedItems,
      page,
      pageSize,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
      total,
      personalized: Boolean(signals.stressLevel),
      musicDebug,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("discover-feed error:", msg);
    return jsonResponse({ error: "Internal error", detail: msg }, 500);
  }
});
