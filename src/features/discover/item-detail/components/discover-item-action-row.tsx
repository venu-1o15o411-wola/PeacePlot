import React from "react";
import { Pressable, Text, View } from "react-native";

import type { DiscoverActionType } from "@/features/discover/item-detail/types";

type Props = {
  styles: ReturnType<typeof import("@/features/discover/item-detail/styles").createDiscoverItemStyles>;
  actionState: string | null;
  onAction: (action: DiscoverActionType) => void;
};

const ACTIONS: Array<{ key: DiscoverActionType; label: string; done: string }> = [
  { key: "save", label: "Save", done: "Saved" },
  { key: "not_for_me", label: "Not for me", done: "Noted" },
  { key: "hide", label: "Hide", done: "Hidden" },
  { key: "complete", label: "Complete", done: "Done" },
];

export function DiscoverItemActionRow({ styles, actionState, onAction }: Props) {
  return (
    <View style={styles.actionRow}>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.key}
          style={styles.actionBtn}
          onPress={() => onAction(action.key)}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={styles.actionBtnText}>
            {actionState === action.key ? action.done : action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
