import { Drawer } from 'expo-router/drawer';
import React from 'react';

import { PeacePlotDrawerContent } from '@/components/drawer-content';
import { PeacePlotColors } from '@/constants/peaceplot-theme';

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <PeacePlotDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: '86%',
          maxWidth: 340,
          backgroundColor: PeacePlotColors.drawerBody,
        },
        drawerActiveTintColor: PeacePlotColors.primary,
        drawerInactiveTintColor: PeacePlotColors.textMuted,
      }}>
      <Drawer.Screen name="(tabs)" options={{ title: 'PeacePlot' }} />
      <Drawer.Screen name="profile" options={{ title: 'Profile' }} />
      <Drawer.Screen name="journal" options={{ title: 'Journal' }} />
    </Drawer>
  );
}
