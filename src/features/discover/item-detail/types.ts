import type { DiscoverRemoteItem } from "@/lib/discover-feed";

export type DiscoverItem = DiscoverRemoteItem;
export type DiscoverMediaType = DiscoverRemoteItem["mediaType"];
export type DiscoverActionType = "save" | "hide" | "not_for_me" | "complete";
