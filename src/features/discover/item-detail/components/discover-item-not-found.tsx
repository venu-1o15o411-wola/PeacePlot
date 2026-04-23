import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  styles: ReturnType<typeof import("@/features/discover/item-detail/styles").createDiscoverItemStyles>;
  insetsTop: number;
  textColor: string;
  bodyColor: string;
  onBack: () => void;
};

export function DiscoverItemNotFound({
  styles,
  insetsTop,
  textColor,
  bodyColor,
  onBack,
}: Props) {
  return (
    <View style={[styles.root, styles.notFound, { paddingTop: insetsTop }]}>
      <Pressable onPress={onBack} style={styles.backRow} accessibilityRole="button">
        <Ionicons name="chevron-back" size={24} color={textColor} />
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>
      <Text style={{ fontSize: 16, color: bodyColor }}>
        This item is not in the library yet.
      </Text>
    </View>
  );
}
