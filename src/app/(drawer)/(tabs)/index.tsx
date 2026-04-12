import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DoctorQuotesSlider } from '@/components/doctor-quotes-slider';
import { MeasureGrid } from '@/components/measure-grid';
import { PeacePlotColors } from '@/constants/peaceplot-theme';

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <DoctorQuotesSlider />
      <Text style={styles.measureHeading}>Measure stress</Text>
      <Text style={styles.measureSub}>Choose a way to check in — audio is for measurement only, not music.</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 8,
  },
  measureHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: PeacePlotColors.text,
    marginBottom: 6,
  },
  measureSub: {
    fontSize: 13,
    color: PeacePlotColors.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
});
