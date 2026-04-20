import AsyncStorage from "@react-native-async-storage/async-storage";
import { FunctionsHttpError } from "@supabase/functions-js";

import type { DiscoverChipId, DiscoverItem, DiscoverModality } from "@/data/discover-mock";
import { requireSupabase } from "@/lib/supabase";

const FUNCTION_NAME = "discover-feed";
const SUPPRESSED_ITEMS_KEY = "discover-suppressed-item-ids-v1";
const DISCOVER_FEATURED_CACHE_KEY = "discover-featured-cache-v3";
const DISCOVER_FEED_CACHE_KEY_PREFIX = "discover-feed-cache-v3";

export type DiscoverRemoteItem = DiscoverItem & {
  source?: string;
  sourceItemId?: string;
  category?: Exclude<DiscoverChipId, "all">;
  mediaType?: "book" | "video" | "audio" | "image" | "text";
  tags?: string[];
  thumbUrl?: string;
  contentUrl?: string;
  contentText?: string;
};


function modalityFromAny(raw: unknown): DiscoverModality {
  const v = String(raw ?? "");
  if (
    v === "book" ||
    v === "video" ||
    v === "music" ||
    v === "story" ||
    v === "yoga" ||
    v === "tai-chi" ||
    v === "place" ||
    v === "ai"
  ) {
    return v;
  }
  return "story";
}

function normalizeItem(input: unknown): DiscoverRemoteItem | null {
  if (!input || typeof input !== "object") return null;
  const x = input as Record<string, unknown>;
  const id = String(x.id ?? "").trim();
  const title = String(x.title ?? "").trim();
  if (!id || !title) return null;
  return {
    id,
    title,
    subtitle: String(x.subtitle ?? "Discover content"),
    duration: String(x.duration ?? "5 min"),
    modality: modalityFromAny(x.modality),
    doctorBadge: x.doctorBadge === true,
    source: typeof x.source === "string" ? x.source : undefined,
    sourceItemId: typeof x.sourceItemId === "string" ? x.sourceItemId : undefined,
    category: typeof x.category === "string"
      ? (x.category as Exclude<DiscoverChipId, "all">)
      : undefined,
    mediaType: typeof x.mediaType === "string"
      ? (x.mediaType as DiscoverRemoteItem["mediaType"])
      : undefined,
    tags: Array.isArray(x.tags) ? x.tags.map((v) => String(v)) : undefined,
    thumbUrl: typeof x.thumbUrl === "string" ? x.thumbUrl : undefined,
    contentUrl: typeof x.contentUrl === "string" ? x.contentUrl : undefined,
    contentText: typeof x.contentText === "string" ? x.contentText : undefined,
  };
}

function hasHttpUrl(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const v = raw.trim().toLowerCase();
  return v.startsWith("http://") || v.startsWith("https://");
}

function isRenderableDiscoverItem(item: DiscoverRemoteItem): boolean {
  const mediaType = item.mediaType;
  const modality = item.modality;
  const contentUrlOk = hasHttpUrl(item.contentUrl);
  const thumbUrlOk = hasHttpUrl(item.thumbUrl);
  const hasText = typeof item.contentText === "string" && item.contentText.trim().length > 0;

  if (mediaType === "audio" || modality === "music") return contentUrlOk;
  if (mediaType === "video" || modality === "video" || modality === "story" || modality === "yoga" || modality === "tai-chi") {
    return contentUrlOk;
  }
  if (mediaType === "image" || modality === "place") return contentUrlOk || thumbUrlOk;
  if (mediaType === "book" || modality === "book") return contentUrlOk || hasText;
  if (mediaType === "text" || modality === "ai") return hasText || contentUrlOk;
  return contentUrlOk || thumbUrlOk || hasText;
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const client = requireSupabase();
  const {
    data: { session },
  } = await client.auth.getSession();
  const { data, error } = await client.functions.invoke<T>(FUNCTION_NAME, {
    body,
    headers: session?.access_token
      ? {
          Authorization: `Bearer ${session.access_token}`,
        }
      : undefined,
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const res = error.context as Response;
      const txt = await res.clone().text().catch(() => "");
      throw new Error(txt || `Discover failed (HTTP ${res.status})`);
    }
    throw new Error(error instanceof Error ? error.message : "Discover failed.");
  }
  return data as T;
}

function feedCacheKey(category: DiscoverChipId, query: string, page: number, pageSize: number): string {
  return `${DISCOVER_FEED_CACHE_KEY_PREFIX}:${category}:${query.toLowerCase()}:${page}:${pageSize}`;
}

export async function fetchDiscoverFeatured(timezone: string): Promise<DiscoverRemoteItem[]> {
  try {
    const res = await invoke<{ items?: unknown[] }>({ mode: "featured", timezone });
    const rows = Array.isArray(res.items) ? res.items : [];
    const normalized = rows.map(normalizeItem).filter(Boolean) as DiscoverRemoteItem[];
    const valid = normalized.filter(isRenderableDiscoverItem);
    await AsyncStorage.setItem(DISCOVER_FEATURED_CACHE_KEY, JSON.stringify(valid));
    return valid.slice(0, 5);
  } catch {
    const cached = await AsyncStorage.getItem(DISCOVER_FEATURED_CACHE_KEY);
    if (!cached) {
      throw new Error(
        "Featured could not load. Please sign in again or redeploy discover-feed with JWT verification disabled for read modes.",
      );
    }
    try {
      const arr = JSON.parse(cached) as unknown[];
      return (arr
        .map(normalizeItem)
        .filter(Boolean) as DiscoverRemoteItem[])
        .filter(isRenderableDiscoverItem)
        .slice(0, 5);
    } catch {
      throw new Error("Featured cache is invalid and remote fetch failed.");
    }
  }
}

export async function fetchDiscoverFeed(params: {
  category: DiscoverChipId;
  query: string;
  page: number;
  pageSize?: number;
}): Promise<{ items: DiscoverRemoteItem[]; hasMore: boolean; nextPage: number | null }> {
  const pageSize = Math.max(15, params.pageSize ?? 15);
  const k = feedCacheKey(params.category, params.query, params.page, pageSize);
  try {
    const res = await invoke<{
      items?: unknown[];
      hasMore?: boolean;
      nextPage?: number | null;
    }>({
      mode: "feed",
      category: params.category,
      query: params.query,
      page: params.page,
      pageSize,
    });
    const normalized = (Array.isArray(res.items) ? res.items : [])
      .map(normalizeItem)
      .filter(Boolean) as DiscoverRemoteItem[];
    const valid = normalized.filter(isRenderableDiscoverItem);
    await AsyncStorage.setItem(k, JSON.stringify({
      items: valid,
      hasMore: res.hasMore === true,
      nextPage: typeof res.nextPage === "number" ? res.nextPage : null,
    }));
    return {
      items: valid,
      hasMore: res.hasMore === true,
      nextPage: typeof res.nextPage === "number" ? res.nextPage : null,
    };
  } catch (e) {
    const cached = await AsyncStorage.getItem(k);
    if (!cached) {
      throw new Error(
        e instanceof Error
          ? e.message
          : "Discover feed failed and no cache is available.",
      );
    }
    try {
      const parsed = JSON.parse(cached) as {
        items?: unknown[];
        hasMore?: boolean;
        nextPage?: number | null;
      };
      const normalized = (Array.isArray(parsed.items) ? parsed.items : [])
        .map(normalizeItem)
        .filter(Boolean) as DiscoverRemoteItem[];
      const valid = normalized.filter(isRenderableDiscoverItem);
      return {
        items: valid,
        hasMore: parsed.hasMore === true,
        nextPage: typeof parsed.nextPage === "number" ? parsed.nextPage : null,
      };
    } catch {
      throw new Error("Discover feed cache is invalid and remote fetch failed.");
    }
  }
}

export async function fetchDiscoverItemById(id: string): Promise<DiscoverRemoteItem | null> {
  try {
    const res = await invoke<{ item?: unknown }>({ mode: "item", id });
    const normalized = normalizeItem(res.item ?? null);
    if (!normalized) return null;
    return isRenderableDiscoverItem(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

export async function sendDiscoverFeedback(params: {
  id: string;
  actionType: "open" | "save" | "hide" | "not_for_me" | "complete";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await invoke<{ ok: boolean }>({
      mode: "feedback",
      id: params.id,
      actionType: params.actionType,
      metadata: params.metadata ?? {},
    });
  } catch {
    // non-blocking telemetry action
  }
}

export async function getSuppressedDiscoverItemIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SUPPRESSED_ITEMS_KEY);
    if (!raw) return new Set<string>();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set<string>();
    return new Set(arr.map((x) => String(x)).filter(Boolean));
  } catch {
    return new Set<string>();
  }
}

export async function suppressDiscoverItemId(id: string): Promise<void> {
  if (!id.trim()) return;
  const next = await getSuppressedDiscoverItemIds();
  next.add(id);
  await AsyncStorage.setItem(SUPPRESSED_ITEMS_KEY, JSON.stringify([...next]));
}

export async function clearSuppressedDiscoverItemIds(): Promise<void> {
  await AsyncStorage.removeItem(SUPPRESSED_ITEMS_KEY);
}

export async function warmDiscoverCache(params?: {
  category?: DiscoverChipId;
  query?: string;
  page?: number;
}): Promise<void> {
  try {
    await invoke<{ ok: boolean }>({
      mode: "warm-cache",
      category: params?.category ?? "all",
      query: params?.query ?? "",
      page: params?.page ?? 1,
    });
  } catch {
    // best-effort optimization only
  }
}
