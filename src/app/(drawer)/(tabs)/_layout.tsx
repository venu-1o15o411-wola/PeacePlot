import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { PeaceTabBar } from '@/components/peace-tab-bar';
import { PeacePlotColors } from '@/constants/peaceplot-theme';

export default function TabsLayout() {
  return (
    <View style={styles.wrap}>
      <AppHeader />
      <Tabs
        tabBar={(props) => <PeaceTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
        <Tabs.Screen name="measure" options={{ title: 'Measure' }} />
        <Tabs.Screen name="forum" options={{ title: 'Forum' }} />
        <Tabs.Screen name="sleep" options={{ title: 'Sleep' }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: PeacePlotColors.background,
  },
});
