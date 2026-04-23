import { useEffect, useState } from "react";

import {
  sendDiscoverFeedback,
  suppressDiscoverItemId,
} from "@/lib/discover-feed";
import type {
  DiscoverActionType,
  DiscoverItem,
} from "@/features/discover/item-detail/types";

type UseDiscoverItemFeedbackArgs = {
  item: DiscoverItem | undefined;
  onHiddenItem: () => void;
};

export function useDiscoverItemFeedback({
  item,
  onHiddenItem,
}: UseDiscoverItemFeedbackArgs) {
  const [openedFeedbackId, setOpenedFeedbackId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<string | null>(null);

  useEffect(() => {
    if (!item?.id || item.id === openedFeedbackId) return;
    setOpenedFeedbackId(item.id);
    void sendDiscoverFeedback({
      id: item.id,
      actionType: "open",
      metadata: {
        source: item.source ?? "unknown",
        mediaType: item.mediaType ?? "unknown",
      },
    });
  }, [item, openedFeedbackId]);

  const sendAction = (actionType: DiscoverActionType) => {
    if (!item?.id) return;
    setActionState(actionType);
    void sendDiscoverFeedback({
      id: item.id,
      actionType,
      metadata: {
        source: item.source ?? "unknown",
        mediaType: item.mediaType ?? "unknown",
        title: item.title,
      },
    }).finally(async () => {
      if (actionType === "hide" || actionType === "not_for_me") {
        await suppressDiscoverItemId(item.id);
        onHiddenItem();
        return;
      }
      setTimeout(() => setActionState(null), 700);
    });
  };

  return { actionState, sendAction };
}
