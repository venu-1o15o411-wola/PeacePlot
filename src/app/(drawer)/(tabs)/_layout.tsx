import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import { AppHeader } from "@/components/navigation/app-header";
import { PeaceTabBar } from "@/components/navigation/peace-tab-bar";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

export default function TabsLayout() {
  const colors = usePeacePlotColors();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <AppHeader />
      <Tabs
        tabBar={(props) => <PeaceTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="discover" options={{ title: "Discover" }} />
        <Tabs.Screen name="measure" options={{ title: "Measure" }} />
        <Tabs.Screen name="forum" options={{ title: "Forum" }} />
        <Tabs.Screen name="sleep" options={{ title: "Sleep" }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
});
