import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PeacePlotColors } from '@/constants/peaceplot-theme';

const ROUTES: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }
> = {
  index: { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  discover: { label: 'Discover', icon: 'compass-outline', activeIcon: 'compass' },
  measure: { label: 'Measure', icon: 'pulse-outline', activeIcon: 'pulse' },
  forum: { label: 'Forum', icon: 'people-outline', activeIcon: 'people' },
  sleep: { label: 'Sleep', icon: 'moon-outline', activeIcon: 'moon' },
};

export function PeaceTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          (options.title as string) || ROUTES[route.name]?.label || route.name;
        const meta = ROUTES[route.name];
        const isFocused = state.index === index;
        const isMeasure = route.name === 'measure';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const iconName = meta
          ? isFocused
            ? meta.activeIcon
            : meta.icon
          : 'ellipse-outline';

        if (isMeasure) {
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.title ?? label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.measureWrap}>
              <View style={[styles.measureFab, isFocused && styles.measureFabActive]}>
                <Ionicons name={iconName} size={28} color={PeacePlotColors.text} />
              </View>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.title ?? label}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}>
            <Ionicons
              name={iconName}
              size={22}
              color={isFocused ? PeacePlotColors.primary : PeacePlotColors.textMuted}
            />
            <Text style={[styles.label, isFocused && styles.labelFocused]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingTop: 10,
    backgroundColor: PeacePlotColors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PeacePlotColors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 48,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 10,
    color: PeacePlotColors.textMuted,
    fontWeight: '500',
  },
  labelFocused: {
    color: PeacePlotColors.primaryLight2,
  },
  measureWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  measureFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PeacePlotColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 3,
    borderColor: PeacePlotColors.measureRing,
    shadowColor: PeacePlotColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    marginTop: -24,
  },
  measureFabActive: {
    backgroundColor: PeacePlotColors.primaryHover,
    borderColor: PeacePlotColors.primaryLight2,
  },
});
