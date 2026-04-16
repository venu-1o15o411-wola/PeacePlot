import { Drawer } from "expo-router/drawer";
import { Redirect } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, View } from "react-native";

import { PeacePlotDrawerContent } from "@/components/navigation/drawer-content";
import { useAuth } from "@/providers/auth-session";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

export default function DrawerLayout() {
  const { session, loading, isSupabaseConfigured } = useAuth();
  const colors = usePeacePlotColors();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isSupabaseConfigured && !session) {
    return <Redirect href="/signin" />;
  }
  const screenOptions = useMemo(
    () => ({
      headerShown: false as const,
      drawerStyle: {
        width: "86%" as const,
        maxWidth: 340,
        backgroundColor: colors.drawerBody,
      },
      drawerActiveTintColor: colors.primary,
      drawerInactiveTintColor: colors.textMuted,
    }),
    [colors],
  );

  return (
    <Drawer
      drawerContent={(props) => <PeacePlotDrawerContent {...props} />}
      screenOptions={screenOptions}
    >
      <Drawer.Screen name="(tabs)" options={{ title: "PeacePlot" }} />
      <Drawer.Screen name="journal" options={{ title: "Journal" }} />
      <Drawer.Screen
        name="notifications"
        options={{ title: "Notifications" }}
      />
    </Drawer>
  );
}
