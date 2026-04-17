import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

import { usePeacePlotAppearance } from "@/providers/peaceplot-appearance";
import { PeacePlotPalettes } from "@/theme/peaceplot-theme";

/** See `plan.md` §2.4 — full-screen ambient loops (light + dark). */
const AMBIENT_GIF_LIGHT = require("../../../assets/images/landing/background-light.gif");
const AMBIENT_GIF_DARK = require("../../../assets/images/landing/background-dark.gif");

/**
 * Light scrim: thin veil — heavy white overlays wash out the GIF.
 */
function lightScrim(): string {
  return "rgba(245, 247, 251, 0.14)";
}

/** Dark scrim: theme-tinted veil for white/light text over the dark GIF. */
function darkScrim(): string {
  return "rgba(36, 52, 87, 0.38)";
}

/**
 * Signed-in shell + estimate flows: **light** and **dark** each use a dedicated ambient GIF
 * + scrim; navigators stay transparent so `theme.colors.background` does not cover the art.
 */
export function PeacePlotAmbientBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  const { scheme } = usePeacePlotAppearance();
  const fallback = PeacePlotPalettes[scheme].background;
  const isDark = scheme === "dark";
  const source = isDark ? AMBIENT_GIF_DARK : AMBIENT_GIF_LIGHT;
  const scrim = isDark ? darkScrim() : lightScrim();

  return (
    <View style={[styles.root, { backgroundColor: fallback }]}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        priority="high"
        cachePolicy="memory-disk"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: scrim }]}
        pointerEvents="none"
        importantForAccessibility="no"
      />
      <View style={styles.foreground} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  foreground: {
    flex: 1,
  },
});
