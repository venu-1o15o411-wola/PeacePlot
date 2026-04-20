import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { consumeVoiceEstimateSession } from "@/lib/voice-estimate-session";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";
import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

const LABELS: Record<string, string> = {
  books: "Books",
  media: "Media",
  activities: "Activities",
  places: "Places",
  ai: "AI advice",
};

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
    body: { padding: 20, gap: 14, paddingBottom: 40 },
    score: { fontSize: 44, fontWeight: "800", color: c.primaryLight2 },
    band: { fontSize: 18, fontWeight: "700", color: c.text },
    lead: { fontSize: 15, lineHeight: 22, color: c.textBody },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      gap: 8,
    },
    cardTitle: { fontSize: 13, fontWeight: "700", color: c.textMuted },
    transcript: { fontSize: 14, lineHeight: 20, color: c.text },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tag: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: c.surfaceDeep,
      borderWidth: 1,
      borderColor: c.border,
    },
    tagText: { fontSize: 13, color: c.text },
    primaryBtn: {
      backgroundColor: c.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 8,
    },
    primaryBtnText: { color: c.textOnPrimary, fontSize: 16, fontWeight: "700" },
    muted: { fontSize: 12, color: c.textMuted, lineHeight: 17 },
  });
}

export default function EstimateResultScreen() {
  const router = useRouter();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [voiceExtras, setVoiceExtras] = useState<{
    transcript: string;
    guidance: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      setVoiceExtras(consumeVoiceEstimateSession());
    }, []),
  );

  const p = useLocalSearchParams<{
    mode?: string;
    stressBand?: string;
    stressScore?: string;
    transcript?: string;
    durationSec?: string;
    datasets?: string;
  }>();

  const datasets = (p.datasets ?? "").split(",").filter(Boolean);
  const band = p.stressBand ?? "moderate";
  const score = p.stressScore ? Number(p.stressScore) : null;
  const transcriptDisplay =
    voiceExtras?.transcript?.trim() || (p.transcript ?? "").trim() || "";
  const guidanceDisplay = (voiceExtras?.guidance ?? "").trim();

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
        <Text style={styles.headerTitle}>Check-in summary</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {score !== null && !Number.isNaN(score) ? (
          <Text style={styles.score} accessibilityRole="text">
            {score}
          </Text>
        ) : null}
        <Text style={styles.band}>
          Stress signal: {band.charAt(0).toUpperCase() + band.slice(1)}
        </Text>
        <Text style={styles.lead}>
          This score is a <Text style={{ fontWeight: "700" }}>placeholder</Text>{" "}
          {p.mode === "camera"
            ? "until on-device MobileNetV2 + MediaPipe are fully wired per the stress plan."
            : p.mode === "audio"
              ? "Stress band still uses local heuristics; voice text uses on-device transcription (iOS file / Android live) plus optional Gemini guidance."
              : "until models run on Supabase per §6.1."}{" "}
          Mode: {p.mode ?? "—"}.
          {p.durationSec ? ` Sample length: ${p.durationSec}s.` : ""}
        </Text>

        {transcriptDisplay ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {p.mode === "audio" ? "Voice transcript" : "Transcript preview"}
            </Text>
            <Text style={styles.transcript}>{transcriptDisplay}</Text>
          </View>
        ) : null}

        {guidanceDisplay ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reflection (Gemini)</Text>
            <Text style={styles.transcript}>{guidanceDisplay}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recommendations will favor</Text>
          <View style={styles.tagRow}>
            {datasets.length ? (
              datasets.map((id) => (
                <View key={id} style={styles.tag}>
                  <Text style={styles.tagText}>{LABELS[id] ?? id}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.transcript}>No datasets selected.</Text>
            )}
          </View>
        </View>

        <Text style={styles.muted}>
          Not medical advice. If you are in crisis, seek professional or
          emergency help immediately.
        </Text>

        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.replace("/(drawer)/(tabs)")}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
        >
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
