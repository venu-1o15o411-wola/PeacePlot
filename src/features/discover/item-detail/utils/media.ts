import type { DiscoverItem, DiscoverMediaType } from "@/features/discover/item-detail/types";

export function mediaPlayerHtml(
  kind: "audio" | "video",
  url: string,
  posterUrl?: string,
): string {
  const safeUrl = encodeURI(url);
  const safePoster = posterUrl ? encodeURI(posterUrl) : "";
  const tag =
    kind === "video"
      ? `<video controls playsinline webkit-playsinline preload="metadata" ${safePoster ? `poster="${safePoster}"` : ""} style="width:100%;height:100%;background:#000" src="${safeUrl}"></video>`
      : `<audio controls style="width:95%;max-width:560px" src="${safeUrl}"></audio>`;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><style>html,body{margin:0;height:100%;background:#111}body{font-family:-apple-system,system-ui;display:flex;align-items:center;justify-content:center;padding:10px}.wrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center}</style></head><body><div class="wrap">${tag}</div></body></html>`;
}

export function resolveMediaType(item: DiscoverItem | undefined): DiscoverMediaType {
  if (!item) return undefined;
  if (item.mediaType) return item.mediaType;
  if (item.modality === "book") return "book";
  if (item.modality === "video" || item.modality === "story") return "video";
  if (item.modality === "music") return "audio";
  if (item.modality === "place") return "image";
  if (item.modality === "ai") return "text";
  return undefined;
}
