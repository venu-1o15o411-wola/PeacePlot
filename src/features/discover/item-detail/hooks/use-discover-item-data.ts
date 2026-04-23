import { useEffect, useState } from "react";

import { fetchDiscoverItemById } from "@/lib/discover-feed";
import type { DiscoverItem } from "@/features/discover/item-detail/types";

export function useDiscoverItemData(id?: string, payload?: string) {
  const [item, setItem] = useState<DiscoverItem | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!id) {
      setItem(undefined);
      setLoading(false);
      return;
    }
    let optimistic: DiscoverItem | undefined;
    if (payload) {
      try {
        const decoded = JSON.parse(decodeURIComponent(payload)) as DiscoverItem;
        if (decoded && typeof decoded.id === "string") {
          optimistic = decoded;
          setItem(decoded);
        }
      } catch {
        // ignore parse failure and continue with fetch
      }
    }
    setLoading(true);
    void fetchDiscoverItemById(id)
      .then((res) => {
        if (!active) return;
        setItem(res ?? optimistic);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, payload]);

  return { item, loading };
}
