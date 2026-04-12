import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { MeasureGrid } from '@/components/measure-grid';
import { PeacePlotColors } from '@/constants/peaceplot-theme';

/** Same four modalities as Home — plan §4.2 center tab. */
export default function MeasureTabScreen() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Measure</Text>
      <Text style={styles.copy}>
        Start a stress check-in. These match the Home grid: camera, fingerprint, voice-for-measurement, and
        questions.
      </Text>
      <MeasureGrid />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: PeacePlotColors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: PeacePlotColors.text,
    marginBottom: 8,
  },
  copy: {
    fontSize: 14,
    lineHeight: 20,
    color: PeacePlotColors.textMuted,
    marginBottom: 16,
  },
});
