import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_ROUTES } from "./tab-bar-config";
import { createTabBarStyles } from "./tab-bar-styles";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

export function PeaceTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createTabBarStyles(colors), [colors]);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const meta = TAB_ROUTES[route.name];
        const label = (options.title as string) || meta?.label || route.name;
        const isFocused = state.index === index;
        const iconName = meta ? (isFocused ? meta.activeIcon : meta.icon) : "ellipse-outline";
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        const onLongPress = () => navigation.emit({ type: "tabLongPress", target: route.key });
        if (route.name === "virtual-doctor") {
          return (
            <Pressable key={route.key} accessibilityRole="button" onPress={onPress} onLongPress={onLongPress} style={styles.centerFabWrap}>
              <View style={[styles.centerFab, isFocused && styles.centerFabActive]}>
                <Ionicons name={iconName} size={28} color={colors.textOnPrimary} />
              </View>
            </Pressable>
          );
        }
        return (
          <Pressable key={route.key} accessibilityRole="button" onPress={onPress} onLongPress={onLongPress} style={styles.tab}>
            <Ionicons name={iconName} size={22} color={isFocused ? colors.primary : colors.textMuted} />
            <Text style={[styles.label, isFocused && styles.labelFocused]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
