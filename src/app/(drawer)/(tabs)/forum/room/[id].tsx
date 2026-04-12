import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { PeacePlotPalette } from "@/theme/peaceplot-theme";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";
import { getForumRoom } from "@/data/forum-mock";

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
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
      marginBottom: 8,
    },
    topic: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textBody,
      marginBottom: 20,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 14,
    },
    cardBody: { fontSize: 15, lineHeight: 22, color: c.textBody },
    searchBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: c.primary,
      marginBottom: 12,
    },
    searchLabel: {
      color: c.textOnPrimary,
      fontSize: 16,
      fontWeight: "800",
    },
    muted: {
      fontSize: 13,
      lineHeight: 19,
      color: c.textMuted,
      marginTop: 8,
    },
    notFound: { padding: 24, fontSize: 16, color: c.textBody },
  });
}

export default function ForumRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const room = useMemo(() => (id ? getForumRoom(String(id)) : undefined), [id]);

  const onSearchUsers = () => {
    Alert.alert(
      "Find people (planned)",
      [
        "Searching by userid or email can enable harassment — PeacePlot will use opt-in discoverability, blocking, and rate limits before shipping this (plan §5.3, research §9).",
        "",
        "For now, join the room when realtime chat is connected via Supabase.",
      ].join("\n"),
    );
  };

  if (!room) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <View style={[styles.root, { paddingTop: insets.top }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backRow}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
            <Text style={styles.backLabel}>Forum</Text>
          </Pressable>
          <Text style={styles.notFound}>Room not found.</Text>
        </View>
      </>
    );
  }

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
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{room.name}</Text>
          <Text style={styles.topic}>{room.topic}</Text>

          <View style={styles.card}>
            <Text style={styles.cardBody}>
              Realtime messages, presence, and moderation queues will use
              Supabase Realtime + Postgres. This screen is a calm placeholder so
              navigation and IA match the plan before backend work.
            </Text>
          </View>

          <Pressable
            style={styles.searchBtn}
            onPress={onSearchUsers}
            accessibilityRole="button"
            accessibilityLabel="Find users — planned feature"
          >
            <Ionicons
              name="person-add-outline"
              size={22}
              color={colors.textOnPrimary}
            />
            <Text style={styles.searchLabel}>Find people (planned)</Text>
          </Pressable>

          <Text style={styles.muted}>
            ~{room.membersApprox} members shown from mock data — not live.
          </Text>
        </ScrollView>
      </View>
    </>
  );
}
