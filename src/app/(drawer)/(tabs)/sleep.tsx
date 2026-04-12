import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import type { PeacePlotPalette } from "@/constants/peaceplot-theme";
import { usePeacePlotColors } from "@/context/peaceplot-appearance";

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: c.background },
    content: { padding: 20, paddingBottom: 100 },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
      marginBottom: 12,
    },
    copy: { fontSize: 15, lineHeight: 22, color: c.textBody },
  });
}

export default function SleepScreen() {
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Sleep</Text>
      <Text style={styles.copy}>
        Wind-down audio, sleep stories, soundscapes, and routines — see plan
        §5.6 and research.md for competitive benchmarks (Calm Sleep, Sleep
        Cycle, BetterSleep).
      </Text>
    </ScrollView>
  );
}
