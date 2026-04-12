import Ionicons from "@expo/vector-icons/Ionicons";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PeacePlotPalette } from "@/constants/peaceplot-theme";
import { usePeacePlotColors } from "@/context/peaceplot-appearance";

const TILES: {
  key: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "camera",
    label: "Camera",
    subtitle: "Visual check-in",
    icon: "camera-outline",
  },
  {
    key: "fingerprint",
    label: "Fingerprint",
    subtitle: "Quick biometric",
    icon: "scan-outline",
  },
  {
    key: "audio",
    label: "Audio",
    subtitle: "Voice for measurement",
    icon: "mic-outline",
  },
  {
    key: "questions",
    label: "Questions",
    subtitle: "Guided check-in",
    icon: "help-circle-outline",
  },
];

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "space-between",
    },
    tile: {
      width: "47%",
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      gap: 8,
      minHeight: 140,
      justifyContent: "center",
    },
    tilePressed: {
      opacity: 0.88,
      borderColor: c.primary,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.surfaceDeep,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    tileTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: c.text,
      textAlign: "center",
    },
    tileSub: {
      fontSize: 12,
      color: c.textMuted,
      textAlign: "center",
    },
  });
}

export function MeasureGrid() {
  const router = useRouter();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.grid}>
      {TILES.map((tile) => (
        <Pressable
          key={tile.key}
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          onPress={() => router.push(`/estimate/${tile.key}` as Href)}
          accessibilityRole="button"
          accessibilityLabel={`${tile.label}: ${tile.subtitle}`}
        >
          <View style={styles.iconCircle}>
            <Ionicons name={tile.icon} size={28} color={colors.text} />
          </View>
          <Text style={styles.tileTitle}>{tile.label}</Text>
          <Text style={styles.tileSub}>{tile.subtitle}</Text>
        </Pressable>
      ))}
    </View>
  );
}
