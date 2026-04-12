import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PeacePlotColors } from '@/constants/peaceplot-theme';

const TILES: {
  key: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: 'camera',
    label: 'Camera',
    subtitle: 'Visual check-in',
    icon: 'camera-outline',
  },
  {
    key: 'fingerprint',
    label: 'Fingerprint',
    subtitle: 'Quick biometric',
    icon: 'scan-outline',
  },
  {
    key: 'audio',
    label: 'Audio',
    subtitle: 'Voice for measurement',
    icon: 'mic-outline',
  },
  {
    key: 'questions',
    label: 'Questions',
    subtitle: 'Guided check-in',
    icon: 'help-circle-outline',
  },
];

/**
 * 2×2 grid for stress measurement entry (plan §4.3).
 * Routes are placeholders until estimation flows exist.
 */
export function MeasureGrid() {
  const router = useRouter();

  return (
    <View style={styles.grid}>
      {TILES.map((tile) => (
        <Pressable
          key={tile.key}
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          onPress={() => router.push(`/estimate/${tile.key}` as Href)}
          accessibilityRole="button"
          accessibilityLabel={`${tile.label}: ${tile.subtitle}`}>
          <View style={styles.iconCircle}>
            <Ionicons name={tile.icon} size={28} color={PeacePlotColors.text} />
          </View>
          <Text style={styles.tileTitle}>{tile.label}</Text>
          <Text style={styles.tileSub}>{tile.subtitle}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  tile: {
    width: '47%',
    backgroundColor: PeacePlotColors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PeacePlotColors.border,
    alignItems: 'center',
    gap: 8,
    minHeight: 140,
    justifyContent: 'center',
  },
  tilePressed: {
    opacity: 0.88,
    borderColor: PeacePlotColors.primary,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PeacePlotColors.primary,
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PeacePlotColors.text,
    textAlign: 'center',
  },
  tileSub: {
    fontSize: 12,
    color: PeacePlotColors.textMuted,
    textAlign: 'center',
  },
});
