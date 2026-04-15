import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import { AppHeader } from "@/components/navigation/app-header";
import { PeaceTabBar } from "@/components/navigation/peace-tab-bar";

export default function TabsLayout() {
  return (
    <View style={styles.wrap}>
      <AppHeader />
      <Tabs
        tabBar={(props) => <PeaceTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="discover" options={{ title: "Discover" }} />
        <Tabs.Screen
          name="virtual-doctor"
          options={{ title: "Virtual doctor" }}
        />
        <Tabs.Screen name="measure" options={{ title: "Measure" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
});
