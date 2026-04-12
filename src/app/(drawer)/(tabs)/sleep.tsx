import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { PeacePlotColors } from '@/constants/peaceplot-theme';

export default function SleepScreen() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Sleep</Text>
      <Text style={styles.copy}>
        Wind-down audio, sleep stories, soundscapes, and routines — see plan §5.6 and research.md for competitive
        benchmarks (Calm Sleep, Sleep Cycle, BetterSleep).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: PeacePlotColors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: PeacePlotColors.text,
    marginBottom: 12,
  },
  copy: {
    fontSize: 15,
    lineHeight: 22,
    color: PeacePlotColors.textBody,
  },
});
