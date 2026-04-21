import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { Suspense, lazy, useMemo } from "react";
import type { ComponentType } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AudioMeasureFlow } from "@/components/estimate/audio-measure-flow";
import { QuestionsMeasureFlow } from "@/components/estimate/questions-measure-flow";
import { VisualMeasureFlow } from "@/components/estimate/visual-measure-flow";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

type FingerFlowProps = { onBack: () => void };

/**
 * Fingerprint-only. Load Vision Camera only in a dev/standalone build.
 * Expo Go (`appOwnership === 'expo'`) cannot load `react-native-vision-camera`; importing the
 * `.native` module throws before exports exist, which breaks `React.lazy` (undefined component).
 */
const FingerMeasureFlow = lazy(async () => {
  const inExpoGo = Constants.appOwnership === "expo";
  const useStub = Platform.OS === "web" || inExpoGo;

  const m = useStub
    ? await import("@/components/estimate/finger-measure-flow.web")
    : await import("@/components/estimate/finger-measure-flow.native");

  const Comp = (m.FingerMeasureFlow ??
    (m as { default: ComponentType<FingerFlowProps> }).default) as
    | ComponentType<FingerFlowProps>
    | undefined;

  if (Comp == null) {
    throw new Error("FingerMeasureFlow failed to load.");
  }

  return { default: Comp };
});
import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

const TITLES: Record<string, string> = {
  camera: "Camera estimation",
  fingerprint: "Fingerprint",
  audio: "Voice (measurement)",
  questions: "Question check-in",
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
    headerTitle: { fontSize: 18, fontWeight: "600", color: c.text },
    body: { padding: 20 },
    copy: { color: c.textBody, fontSize: 15, lineHeight: 22 },
  });
}

function normalizeSegment(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  const s = Array.isArray(value) ? value[0] : value;
  return typeof s === "string" ? s : undefined;
}

export default function EstimateModeScreen() {
  const params = useLocalSearchParams<{ mode: string | string[] }>();
  const mode = normalizeSegment(params.mode);
  const router = useRouter();
  const title = TITLES[mode ?? ""] ?? "Estimation";
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (mode === "audio") {
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
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <AudioMeasureFlow onBack={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (mode === "camera") {
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
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <VisualMeasureFlow onBack={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (mode === "fingerprint") {
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
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <Suspense
          fallback={
            <View style={styles.body}>
              <ActivityIndicator />
            </View>
          }
        >
          <FingerMeasureFlow onBack={() => router.back()} />
        </Suspense>
      </SafeAreaView>
    );
  }

  if (mode === "questions") {
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
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <QuestionsMeasureFlow />
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.copy}>
          This flow will collect inputs for stress estimation, then dataset
          selection and AI recommendations per the product plan. Wire to
          Supabase + models in a later phase.
        </Text>
      </View>
    </SafeAreaView>
  );
}
