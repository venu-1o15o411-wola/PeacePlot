import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import { usePeacePlotColors } from "@/providers/peaceplot-appearance";
import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: "transparent" },
    content: { padding: 16, paddingBottom: 100 },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
      marginBottom: 8,
    },
    copy: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textBody,
    },
  });
}

export default function ProfileTabScreen() {
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.copy}>
        Sign-up fields (userid, email, avatar, password), OAuth, and Supabase
        profiles will be implemented per the plan. This screen follows the
        account/profile patterns from design/xhtml.
      </Text>
    </ScrollView>
  );
}
