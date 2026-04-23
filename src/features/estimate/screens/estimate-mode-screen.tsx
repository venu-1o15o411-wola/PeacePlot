import { useLocalSearchParams, useRouter } from "expo-router";
import React, { Suspense } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { QuestionsMeasureFlow } from "@/components/estimate/questions-measure-flow";
import { VisualMeasureFlow } from "@/components/estimate/visual-measure-flow";
import { EstimateFlowShell } from "@/features/estimate/components/estimate-flow-shell";
import { ESTIMATE_TITLES } from "@/features/estimate/config/mode-config";
import { FingerMeasureFlow } from "@/features/estimate/loaders/finger-flow-loader";
import { normalizeSegment } from "@/features/estimate/utils/normalize-segment";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

export function EstimateModeScreen() {
  const mode = normalizeSegment(useLocalSearchParams<{ mode: string | string[] }>().mode);
  const router = useRouter();
  const colors = usePeacePlotColors();
  const title = ESTIMATE_TITLES[mode ?? ""] ?? "Estimation";

  if (mode === "camera") {
    return <EstimateFlowShell title={title} onBack={() => router.back()}><VisualMeasureFlow onBack={() => router.back()} /></EstimateFlowShell>;
  }
  if (mode === "fingerprint") {
    return (
      <EstimateFlowShell title={title} onBack={() => router.back()}>
        <Suspense fallback={<View style={styles.body}><ActivityIndicator /></View>}>
          <FingerMeasureFlow onBack={() => router.back()} />
        </Suspense>
      </EstimateFlowShell>
    );
  }
  if (mode === "questions") {
    return <EstimateFlowShell title={title} onBack={() => router.back()}><QuestionsMeasureFlow /></EstimateFlowShell>;
  }
  return (
    <EstimateFlowShell title={title} onBack={() => router.back()}>
      <View style={styles.body}>
        <Text style={[styles.copy, { color: colors.textBody }]}>
          This flow will collect inputs for stress estimation, then dataset selection and AI recommendations.
        </Text>
      </View>
    </EstimateFlowShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20 },
  copy: { fontSize: 15, lineHeight: 22 },
});
