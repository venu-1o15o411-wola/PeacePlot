import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import {
  getPeacePlotNavigationTheme,
  PeacePlotPalettes,
} from "@/theme/peaceplot-theme";
import {
  PeacePlotAppearanceProvider,
  usePeacePlotAppearance,
} from "@/providers/peaceplot-appearance";

function NavigationShell({ children }: { children: React.ReactNode }) {
  const { scheme } = usePeacePlotAppearance();
  const navTheme = useMemo(() => getPeacePlotNavigationTheme(scheme), [scheme]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(
      PeacePlotPalettes[scheme].background,
    ).catch(() => {});
  }, [scheme]);

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <PeacePlotAppearanceProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationShell>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(drawer)" />
            <Stack.Screen
              name="estimate"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="signup"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="signin"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
          </Stack>
        </NavigationShell>
      </GestureHandlerRootView>
    </PeacePlotAppearanceProvider>
  );
}
