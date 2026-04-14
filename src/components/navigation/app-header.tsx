import Ionicons from "@expo/vector-icons/Ionicons";
import { DrawerActions } from "@react-navigation/native";
import { Image } from "expo-image";
import { useNavigation, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { PeacePlotPalette } from "@/theme/peaceplot-theme";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

function createStyles(colors: PeacePlotPalette) {
  return StyleSheet.create({
    bar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: colors.headerGlass,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    logo: {
      width: 140,
      height: 40,
      maxWidth: "55%",
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    iconBtn: {
      padding: 8,
    },
  });
}

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const openNotifications = () => {
    router.push("/notifications");
  };

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <Image
        source={require("@/assets/images/brand/peaceplot.png")}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="PeacePlot"
      />
      <View style={styles.actions}>
        <Pressable
          onPress={openNotifications}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.text}
          />
        </Pressable>
        <Pressable
          onPress={openDrawer}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Ionicons name="grid-outline" size={24} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}
