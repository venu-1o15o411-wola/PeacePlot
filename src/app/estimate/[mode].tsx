import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PeacePlotColors } from '@/constants/peaceplot-theme';

const TITLES: Record<string, string> = {
  camera: 'Camera estimation',
  fingerprint: 'Fingerprint',
  audio: 'Voice (measurement)',
  questions: 'Question check-in',
};

export default function EstimateModeScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const router = useRouter();
  const title = TITLES[mode ?? ''] ?? 'Estimation';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={28} color={PeacePlotColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.copy}>
          This flow will collect inputs for stress estimation, then dataset selection and AI recommendations per the
          product plan. Wire to Supabase + models in a later phase.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PeacePlotColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PeacePlotColors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PeacePlotColors.text,
  },
  body: {
    padding: 20,
  },
  copy: {
    color: PeacePlotColors.textBody,
    fontSize: 15,
    lineHeight: 22,
  },
});
