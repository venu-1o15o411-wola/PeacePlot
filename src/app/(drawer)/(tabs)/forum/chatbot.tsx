import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { PeacePlotPalette } from "@/theme/peaceplot-theme";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    backLabel: { fontSize: 16, fontWeight: "600", color: c.primary },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 120 },
    hero: {
      alignItems: "center",
      paddingVertical: 20,
      marginBottom: 8,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 18,
      backgroundColor: "rgba(33, 150, 243, 0.15)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
      textAlign: "center",
      marginBottom: 8,
    },
    sub: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textBody,
      textAlign: "center",
      maxWidth: 340,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: c.textMuted,
      marginBottom: 8,
      letterSpacing: 0.6,
    },
    cardBody: { fontSize: 15, lineHeight: 22, color: c.textBody },
    inputWrap: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      backgroundColor: c.surfaceInput,
      minHeight: 100,
      padding: 12,
      marginBottom: 12,
    },
    input: {
      fontSize: 16,
      color: c.text,
      minHeight: 80,
      textAlignVertical: "top",
    },
    sendBtn: {
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    sendLabel: {
      color: c.textOnPrimary,
      fontSize: 16,
      fontWeight: "800",
    },
    crisis: {
      marginTop: 20,
      fontSize: 12,
      lineHeight: 18,
      color: c.textMuted,
      fontStyle: "italic",
    },
  });
}

export default function ForumChatbotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backRow}
          accessibilityRole="button"
          accessibilityLabel="Back to Forum"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.backLabel}>Forum</Text>
        </Pressable>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <Ionicons name="chatbubbles" size={36} color={colors.primary} />
            </View>
            <Text style={styles.title}>PeacePlot assistant</Text>
            <Text style={styles.sub}>
              Short, supportive answers — not therapy. Full chat, safety
              classifiers, and crisis routing will connect to Supabase Edge
              functions when ready.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>TRY A PROMPT (PLACEHOLDER)</Text>
            <Text style={styles.cardBody}>
              Example: “I’m tense before work — what’s one 2-minute move from
              the library?” Replies will pull from Discover and Measure links,
              not open-ended medical advice.
            </Text>
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Type a message…"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              multiline
              editable={false}
            />
          </View>

          <Pressable
            style={styles.sendBtn}
            onPress={() =>
              Alert.alert(
                "Assistant",
                "Messaging backend is not connected yet. See plan §5.3 and §6.1 for Supabase + AI proxy.",
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Text style={styles.sendLabel}>SEND</Text>
          </Pressable>

          <Text style={styles.crisis}>
            If you are in immediate danger, contact local emergency services. A
            crisis shortcut will appear here per research §9 / plan hygiene.
          </Text>
        </ScrollView>
      </View>
    </>
  );
}
