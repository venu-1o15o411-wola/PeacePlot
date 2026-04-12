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

export default function ForumScreen() {
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Forum</Text>
      <Text style={styles.copy}>
        Articles, chat rooms, chatbot, tree comments, and likes will live here.
        Use design/xhtml list patterns for density.
      </Text>
    </ScrollView>
  );
}
