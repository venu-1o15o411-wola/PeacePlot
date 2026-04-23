import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  textColor: string;
  mutedColor: string;
  styles: ReturnType<typeof import("@/features/navigation/drawer/drawer-styles").createDrawerStyles>;
  destructive?: boolean;
  badge?: number;
};

export function DrawerMenuRow({
  icon,
  label,
  onPress,
  textColor,
  mutedColor,
  styles,
  destructive,
  badge,
}: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}>
      <Ionicons name={icon} size={22} color={destructive ? "#ff8a80" : textColor} />
      <Text style={[styles.menuLabel, destructive && styles.destructive]}>{label}</Text>
      <View style={styles.rowRight}>
        {badge != null && badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : String(badge)}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={mutedColor} />
      </View>
    </Pressable>
  );
}
