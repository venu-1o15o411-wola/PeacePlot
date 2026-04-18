import "react-native-reanimated";

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
import { AuthProvider } from "@/providers/auth-session";
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
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationShell>
            <Stack
              screenOptions={({ route }) => ({
                headerShown: false,
                ...(["estimate", "signup", "signin"].includes(route.name)
                  ? {
                      presentation: "card" as const,
                      animation: "slide_from_right" as const,
                    }
                  : {}),
              })}
            />
          </NavigationShell>
        </GestureHandlerRootView>
      </AuthProvider>
    </PeacePlotAppearanceProvider>
  );
}
