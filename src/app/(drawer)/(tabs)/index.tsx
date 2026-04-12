import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { DoctorQuotesSlider } from "@/components/doctor-quotes-slider";
import { MeasureGrid } from "@/components/measure-grid";
import type { PeacePlotPalette } from "@/constants/peaceplot-theme";
import { usePeacePlotColors } from "@/context/peaceplot-appearance";

function createHomeStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 100,
      paddingTop: 8,
    },
    measureHeading: {
      fontSize: 20,
      fontWeight: "800",
      color: c.text,
      marginBottom: 6,
    },
    measureSub: {
      fontSize: 13,
      color: c.textMuted,
      marginBottom: 16,
      lineHeight: 18,
    },
  });
}

export default function HomeScreen() {
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <DoctorQuotesSlider />
      <Text style={styles.measureHeading}>Measure stress</Text>
      <Text style={styles.measureSub}>
        Choose a way to check in — audio is for measurement only, not music.
      </Text>
      <MeasureGrid />
    </ScrollView>
  );
}
