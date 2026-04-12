import { Drawer } from "expo-router/drawer";
import React, { useMemo } from "react";

import { PeacePlotDrawerContent } from "@/components/navigation/drawer-content";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

export default function DrawerLayout() {
  const colors = usePeacePlotColors();
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
      <Drawer.Screen name="profile" options={{ title: "Profile" }} />
      <Drawer.Screen name="journal" options={{ title: "Journal" }} />
    </Drawer>
  );
}
