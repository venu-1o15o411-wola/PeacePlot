import Ionicons from "@expo/vector-icons/Ionicons";
import type { Href } from "expo-router";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePeacePlotColors } from "@/providers/peaceplot-appearance";
import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

const OPTIONS: { id: string; label: string; hint: string }[] = [
  {
    id: "books",
    label: "Books",
    hint: "Peaceful reads & doctor-curated lists",
  },
  { id: "media", label: "Media", hint: "Video, story, music (library)" },
  { id: "activities", label: "Activities", hint: "Yoga & Tai Chi" },
  { id: "places", label: "Places", hint: "Location-based ideas" },
  { id: "ai", label: "AI advice", hint: "Short actionable tips" },
];

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: "transparent" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    headerTitle: { fontSize: 18, fontWeight: "600", color: c.text, flex: 1 },
    scroll: { flex: 1 },
    body: { padding: 20, gap: 16, paddingBottom: 40 },
    lead: { fontSize: 15, lineHeight: 22, color: c.textBody },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    chipOn: { borderColor: c.primary, backgroundColor: c.surfaceDeep },
    chipLabel: { fontSize: 16, fontWeight: "600", color: c.text },
    chipHint: { fontSize: 12, color: c.textMuted, marginTop: 4 },
    primaryBtn: {
      backgroundColor: c.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    primaryBtnText: { color: c.textOnPrimary, fontSize: 16, fontWeight: "700" },
    muted: { fontSize: 12, color: c.textMuted, lineHeight: 17 },
  });
}

export default function DatasetTypesScreen() {
  const router = useRouter();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{
    mode?: string;
    stressBand?: string;
    stressScore?: string;
    transcript?: string;
    durationSec?: string;
  }>();

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(["books", "media", "ai"]),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onContinue = () => {
    const datasets = Array.from(selected).join(",");
    router.push({
      pathname: "/estimate/result",
      params: {
        mode: params.mode ?? "audio",
        stressBand: params.stressBand ?? "moderate",
        stressScore: params.stressScore ?? "",
        transcript: params.transcript ?? "",
        durationSec: params.durationSec ?? "",
        datasets,
      },
    } as Href);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Your interests</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
        <Text style={styles.lead}>
          Before we tailor suggestions, choose the kinds of content you want us
          to emphasize. You can change this anytime (see plan §3.1 / §5.2).
        </Text>
        {OPTIONS.map((o) => {
          const on = selected.has(o.id);
          return (
            <Pressable
              key={o.id}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => toggle(o.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.chipLabel}>{o.label}</Text>
                <Text style={styles.chipHint}>{o.hint}</Text>
              </View>
              <Ionicons
                name={on ? "checkbox" : "square-outline"}
                size={26}
                color={on ? colors.primary : colors.textMuted}
              />
            </Pressable>
          );
        })}
        <Text style={styles.muted}>
          Wellness only—not a diagnosis. Crisis? Contact local emergency
          services or a crisis line.
        </Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={onContinue}
          disabled={selected.size === 0}
          accessibilityRole="button"
          accessibilityLabel="View results"
        >
          <Text style={styles.primaryBtnText}>See summary</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
