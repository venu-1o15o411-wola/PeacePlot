import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { PeacePlotPalette } from "@/constants/peaceplot-theme";
import { usePeacePlotColors } from "@/context/peaceplot-appearance";
import { getDiscoverItem } from "@/data/discover-mock";

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 4,
    },
    backLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: c.primary,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 120,
    },
    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    pill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    pillText: {
      fontSize: 12,
      fontWeight: "600",
      color: c.textBody,
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: c.text,
      marginBottom: 8,
      lineHeight: 30,
    },
    sub: {
      fontSize: 16,
      lineHeight: 24,
      color: c.textBody,
      marginBottom: 20,
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
      letterSpacing: 0.8,
    },
    cardBody: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textBody,
    },
    disclaimer: {
      fontSize: 12,
      lineHeight: 18,
      color: c.textMuted,
      fontStyle: "italic",
    },
    notFound: {
      padding: 24,
    },
  });
}

export default function DiscoverItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const item = useMemo(() => (id ? getDiscoverItem(String(id)) : undefined), [id]);

  if (!item) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <View style={[styles.root, styles.notFound, { paddingTop: insets.top }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backRow}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <Text style={{ fontSize: 16, color: colors.textBody }}>
            This item is not in the library yet.
          </Text>
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
          accessibilityLabel="Back to Discover"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.backLabel}>Discover</Text>
        </Pressable>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.badgeRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{item.duration}</Text>
            </View>
            {item.doctorBadge ? (
              <View style={[styles.pill, { borderColor: colors.primary }]}>
                <Text style={[styles.pillText, { color: colors.primary }]}>
                  Trusted pick
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.sub}>{item.subtitle}</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>PREVIEW</Text>
            <Text style={styles.cardBody}>
              Full content, playback, and bookmarks will load from Supabase when
              the library schema is connected. Dataset preferences after stress
              estimation can tailor what you see here.
            </Text>
          </View>

          <Text style={styles.disclaimer}>
            Wellness information only — not a substitute for professional care.
            AI and location features follow the permissions and disclosures in the
            product plan.
          </Text>
        </ScrollView>
      </View>
    </>
  );
}
