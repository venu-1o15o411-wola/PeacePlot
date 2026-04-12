import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { PeacePlotPalette } from "@/constants/peaceplot-theme";
import { usePeacePlotColors } from "@/context/peaceplot-appearance";

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    title: { fontSize: 20, fontWeight: "700", color: c.text },
    body: { padding: 20 },
    copy: { fontSize: 15, lineHeight: 22, color: c.textBody },
  });
}

export default function ProfileScreen() {
  const router = useRouter();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Profile</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.copy}>
          Sign-up fields (userid, email, avatar, password), OAuth, and Supabase
          profiles will be implemented per the plan. This screen follows the
          account/profile patterns from design/xhtml.
        </Text>
      </View>
    </SafeAreaView>
  );
}
