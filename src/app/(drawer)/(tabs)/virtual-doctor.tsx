import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import type { PeacePlotPalette } from "@/theme/peaceplot-theme";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, paddingBottom: 100 },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
      marginBottom: 8,
    },
    copy: {
      fontSize: 14,
      lineHeight: 20,
      color: c.textMuted,
      marginBottom: 16,
    },
  });
}

export default function VirtualDoctorTabScreen() {
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Virtual doctor</Text>
      <Text style={styles.copy}>
        A calm, guided space for doctor-style support and education—scoped to
        wellness (not emergency care). AI and provider integrations will follow
        the trust and safety rules in the product plan.
      </Text>
    </ScrollView>
  );
}
