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
  source: "seed" | "pixabay" | "jamendo" | "gutendex";
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

function ttlIso(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
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

async function fetchJamendoMusic(clientId: string, query: string, offset: number): Promise<DiscoverItem[]> {
  const u = new URL("https://api.jamendo.com/v3.0/tracks/");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("format", "json");
  u.searchParams.set("limit", "60");
  u.searchParams.set("offset", String(offset));
  u.searchParams.set("include", "musicinfo");
  u.searchParams.set("audioformat", "mp32");
  u.searchParams.set("order", "popularity_total");
  // Relaxation-oriented query, but keep retrieval broad enough to avoid empty lists.
  if (query.trim()) {
    u.searchParams.set("search", query.trim());
  } else {
    u.searchParams.set("search", "relaxing instrumental ambient meditation");
  }
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 4500);
  try {
    const res = await fetch(u.toString(), { signal: ac.signal });
    if (!res.ok) return [];
    const body = await res.json() as {
      results?: Array<{
        id: string;
        name: string;
        artist_name?: string;
        duration?: number;
        audio?: string;
        audiodownload?: string;
      }>;
    };
    const out: DiscoverItem[] = [];
    const seenUrls = new Set<string>();
    const bannedTerms = [
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
    for (const [i, r] of (body.results ?? []).slice(0, 120).entries()) {
      const contentUrl = [r.audio, r.audiodownload].find(
        (x) => typeof x === "string" && x.startsWith("http"),
      );
      if (!contentUrl || seenUrls.has(contentUrl)) continue;
      const durationSec = Math.max(0, Number(r.duration ?? 0));
      // Hard floor: only tracks >= 60 seconds.
      if (durationSec < 60) continue;

      const title = String(r.name ?? "").trim();
      const artist = String(r.artist_name ?? "").trim();
      const blob = `${title} ${artist}`.toLowerCase();
      // Remove obvious sound-effects style entries.
      if (bannedTerms.some((t) => blob.includes(t))) continue;

      seenUrls.add(contentUrl);
      out.push({
        id: `jamendo:${r.id}`,
        source: "jamendo",
        sourceItemId: String(r.id),
        category: "music",
        modality: "music",
        mediaType: "audio",
        title: title || `Track ${i + 1}`,
        subtitle: artist ? `By ${artist}` : "Calming track",
        duration: `${Math.max(1, Math.round(durationSec / 60))} min`,
        tags: ["music", "jamendo", "calm"],
        contentUrl,
      });
      if (out.length >= 20) break;
    }
    return out;
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
  const key = `gutendex:${query.toLowerCase()}:${page}`;
  const cached = await getRawCache<DiscoverItem[]>(supabase, key);
  if (cached) return cached;
  const fresh = await fetchGutendex(query, page);
  if (fresh.length) await setRawCache(supabase, key, "gutendex", fresh, 24);
  return fresh;
}

async function fetchPixabayCached(
  supabase: DiscoverSupabase,
  apiKey: string,
  query: string,
  page: number,
  kind: "media" | "places",
): Promise<DiscoverItem[]> {
  const key = `pixabay:${kind}:${query.toLowerCase()}:${page}`;
  const cached = await getRawCache<DiscoverItem[]>(supabase, key);
  if (cached) return cached;
  const fresh = await fetchPixabayMedia(apiKey, query, page, kind);
  if (fresh.length) await setRawCache(supabase, key, "pixabay", fresh, 24);
  return fresh;
}

async function fetchJamendoCached(
  supabase: DiscoverSupabase,
  clientId: string,
  query: string,
  offset: number,
): Promise<DiscoverItem[]> {
  const key = `jamendo:${query.toLowerCase()}:${offset}`;
  const cached = await getRawCache<DiscoverItem[]>(supabase, key);
  if (cached) return cached;
  const fresh = await fetchJamendoMusic(clientId, query, offset);
  if (fresh.length) await setRawCache(supabase, key, "jamendo", fresh, 12);
  return fresh;
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

function queryHashFor(params: {
  profileId: string;
  category: DiscoverCategory;
  query: string;
  page: number;
  pageSize: number;
  dayKey: string;
}): string {
  const k = `v5musicfetch|${params.profileId}|${params.category}|${params.query.toLowerCase()}|${params.page}|${params.pageSize}|${params.dayKey}`;
  return `qh_${hashString(k)}`;
}

async function getRawCache<T>(
  supabase: DiscoverSupabase,
  cacheKey: string,
): Promise<T | null> {
  const { data } = await supabase
    .from("discover_raw_cache")
    .select("payload_json, expires_at")
    .eq("cache_key", cacheKey)
    .gt("expires_at", nowIso())
    .maybeSingle();
  return (data?.payload_json as T | undefined) ?? null;
}

async function setRawCache(
  supabase: DiscoverSupabase,
  cacheKey: string,
  source: string,
  payload: unknown,
  ttlHours: number,
): Promise<void> {
  await supabase.from("discover_raw_cache").upsert({
    cache_key: cacheKey,
    source,
    payload_json: payload,
    fetched_at: nowIso(),
    expires_at: ttlIso(ttlHours),
  });
}

async function upsertCatalogItems(
  supabase: DiscoverSupabase,
  items: DiscoverItem[],
): Promise<void> {
  if (!items.length) return;
  await supabase.from("discover_catalog_cache").upsert(
    items.map((x) => ({
      item_uid: x.id,
      source: x.source,
      category: x.category,
      tags: x.tags,
      item_json: x,
      updated_at: nowIso(),
      expires_at: ttlIso(48),
    })),
    { onConflict: "item_uid" },
  );
}

async function loadItemsFromCatalog(
  supabase: DiscoverSupabase,
  ids: string[],
): Promise<DiscoverItem[]> {
  if (!ids.length) return [];
  const { data } = await supabase
    .from("discover_catalog_cache")
    .select("item_uid, item_json")
    .in("item_uid", ids);
  const map = new Map<string, DiscoverItem>();
  for (const row of data ?? []) {
    const uid = String((row as Record<string, unknown>).item_uid ?? "");
    const raw = (row as Record<string, unknown>).item_json;
    if (!uid || !raw || typeof raw !== "object") continue;
    map.set(uid, raw as DiscoverItem);
  }
  return ids.map((id) => map.get(id)).filter(Boolean) as DiscoverItem[];
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
  for (const x of items) buckets[x.category].push(x);
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
  const start = (page - 1) * pageSize;
  return merged.slice(start, start + pageSize);
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
      const pageToWarm = Math.max(1, Number(body.page ?? 1));
      const queryToWarm = (body.query ?? "").trim();
      const [booksWarm, mediaWarm, placesWarm, musicWarm, movementWarm] = await Promise.all([
        fetchGutendexCached(supabase, queryToWarm, pageToWarm),
        Deno.env.get("PIXABAY_API_KEY")
          ? fetchPixabayCached(supabase, Deno.env.get("PIXABAY_API_KEY")!, queryToWarm, pageToWarm, "media")
          : Promise.resolve([] as DiscoverItem[]),
        Deno.env.get("PIXABAY_API_KEY")
          ? fetchPixabayCached(supabase, Deno.env.get("PIXABAY_API_KEY")!, queryToWarm, pageToWarm, "places")
          : Promise.resolve([] as DiscoverItem[]),
        Deno.env.get("JAMENDO_CLIENT_ID")
          ? fetchJamendoCached(supabase, Deno.env.get("JAMENDO_CLIENT_ID")!, queryToWarm, 0)
          : Promise.resolve([] as DiscoverItem[]),
        Deno.env.get("PIXABAY_API_KEY")
          ? fetchPixabayCached(supabase, Deno.env.get("PIXABAY_API_KEY")!, `${queryToWarm} yoga tai chi`, pageToWarm, "media")
          : Promise.resolve([] as DiscoverItem[]),
      ]);
      const movementMapped = movementWarm.map((x, i) => ({
        ...x,
        id: `pixabay:movement:${x.sourceItemId}:${i}`,
        category: "movement" as const,
        modality: i % 2 === 0 ? "yoga" as const : "tai-chi" as const,
      }));
      const warmed = dedupe([
        ...booksWarm,
        ...mediaWarm,
        ...placesWarm,
        ...musicWarm,
        ...movementMapped,
      ]);
      await upsertCatalogItems(supabase, warmed);
      return jsonResponse({ ok: true, warmedCount: warmed.length });
    }

    const signals = profileId
      ? await loadSignals(supabase, profileId)
      : { stressLevel: null, moodValence: null, energyLevel: null, primarySources: [], secondarySources: [] };
    const weights = categoryWeights(signals);
    let pool: DiscoverItem[] = makeSeedCatalog();
    const [booksExt, mediaExt, placesExt, musicExt, movementExt] = await Promise.all([
      fetchGutendexCached(supabase, query, page),
      Deno.env.get("PIXABAY_API_KEY")
        ? fetchPixabayCached(supabase, Deno.env.get("PIXABAY_API_KEY")!, query, page, "media")
        : Promise.resolve([] as DiscoverItem[]),
      Deno.env.get("PIXABAY_API_KEY")
        ? fetchPixabayCached(supabase, Deno.env.get("PIXABAY_API_KEY")!, query, page, "places")
        : Promise.resolve([] as DiscoverItem[]),
      Deno.env.get("JAMENDO_CLIENT_ID")
        ? fetchJamendoCached(supabase, Deno.env.get("JAMENDO_CLIENT_ID")!, query, (page - 1) * pageSize)
        : Promise.resolve([] as DiscoverItem[]),
      Deno.env.get("PIXABAY_API_KEY")
        ? fetchPixabayCached(supabase, Deno.env.get("PIXABAY_API_KEY")!, `${query} yoga tai chi`, page, "media")
        : Promise.resolve([] as DiscoverItem[]),
    ]);
    const movementMapped = movementExt.map((x, i) => ({
      ...x,
      id: `pixabay:movement:${x.sourceItemId}:${page}:${i}`,
      category: "movement" as const,
      modality: i % 2 === 0 ? "yoga" as const : "tai-chi" as const,
      subtitle: "Guided movement visual from Pixabay",
    }));
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
    pool = dedupe(pool.concat(booksExt, mediaExt, placesExt, musicExt, movementMapped, aiExt)).filter(
      hasRenderableMedia,
    );
    await upsertCatalogItems(supabase, pool);

    if (mode === "item") {
      const id = body.id ?? "";
      const [cached] = await loadItemsFromCatalog(supabase, [id]);
      const item = cached ?? pool.find((x) => x.id === id);
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

    const qHash = queryHashFor({
      profileId: profileId ?? "anon",
      category,
      query,
      page,
      pageSize,
      dayKey,
    });
    const { data: cachedQuery } = await supabase
      .from("discover_query_cache")
      .select("item_ids, has_more, total_count, expires_at")
      .eq("query_hash", qHash)
      .gt("expires_at", nowIso())
      .maybeSingle();
    if (cachedQuery?.item_ids && Array.isArray(cachedQuery.item_ids)) {
      const ids = cachedQuery.item_ids.map((x: unknown) => String(x)).filter(Boolean);
      const cachedItems = await loadItemsFromCatalog(supabase, ids);
      if (cachedItems.length) {
        return jsonResponse({
          items: dedupe(cachedItems),
          page,
          pageSize,
          hasMore: cachedQuery.has_more === true,
          nextPage: cachedQuery.has_more === true ? page + 1 : null,
          total: Number(cachedQuery.total_count ?? cachedItems.length),
          personalized: Boolean(signals.stressLevel),
          cacheHit: true,
        });
      }
    }

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
    const hasMore = page * pageSize < total;
    const dedupedItems = dedupe(items);
    await supabase.from("discover_query_cache").upsert({
      query_hash: qHash,
      category,
      query_text: query,
      page,
      page_size: pageSize,
      item_ids: dedupedItems.map((x) => x.id),
      total_count: total,
      has_more: hasMore,
      updated_at: nowIso(),
      expires_at: ttlIso(6),
    });
    return jsonResponse({
      items: dedupedItems,
      page,
      pageSize,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
      total,
      personalized: Boolean(signals.stressLevel),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("discover-feed error:", msg);
    return jsonResponse({ error: "Internal error", detail: msg }, 500);
  }
});
