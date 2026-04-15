import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";

import { usePeacePlotColors } from "@/providers/peaceplot-appearance";
import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

const LANDING_IMAGES = {
  camera: require("../../../assets/images/landing/camera.jpg"),
  fingerprint: require("../../../assets/images/landing/fingerprint.jpg"),
  audio: require("../../../assets/images/landing/voice.jpg"),
  questions: require("../../../assets/images/landing/questions.jpg"),
} as const;

const TILES: {
  key: string;
  label: string;
  subtitle: string;
  image: ImageSourcePropType | null;
  placeholderIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "camera",
    label: "Camera",
    subtitle: "Visual check-in",
    image: LANDING_IMAGES.camera,
    placeholderIcon: "camera-outline",
  },
  {
    key: "fingerprint",
    label: "Fingerprint",
    subtitle: "Quick biometric",
    image: LANDING_IMAGES.fingerprint,
    placeholderIcon: "scan-outline",
  },
  {
    key: "audio",
    label: "Audio",
    subtitle: "Voice for measurement",
    image: LANDING_IMAGES.audio,
    placeholderIcon: "mic-outline",
  },
  {
    key: "questions",
    label: "Questions",
    subtitle: "Guided check-in",
    image: LANDING_IMAGES.questions,
    placeholderIcon: "help-circle-outline",
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
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    tilePressed: {
      opacity: 0.92,
      borderColor: c.primary,
    },
    media: {
      height: 118,
      width: "100%",
      backgroundColor: c.surfaceDeep,
    },
    image: {
      ...StyleSheet.absoluteFillObject,
    },
    imageFade: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.22)",
    },
    placeholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primaryDark,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    body: {
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 12,
      gap: 4,
    },
    tileTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: c.text,
      letterSpacing: 0.2,
    },
    tileSub: {
      fontSize: 12,
      lineHeight: 16,
      color: c.textMuted,
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
          <View
            style={styles.media}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {tile.image ? (
              <>
                <Image
                  source={tile.image}
                  style={styles.image}
                  contentFit="cover"
                  transition={180}
                />
                <View style={styles.imageFade} pointerEvents="none" />
              </>
            ) : (
              <View style={styles.placeholder}>
                <Ionicons
                  name={tile.placeholderIcon}
                  size={40}
                  color={colors.primaryLight2}
                />
              </View>
            )}
          </View>
          <View style={styles.body}>
            <Text style={styles.tileTitle}>{tile.label}</Text>
            <Text style={styles.tileSub}>{tile.subtitle}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
