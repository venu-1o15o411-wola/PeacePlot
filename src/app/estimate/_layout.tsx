import { Stack } from 'expo-router';
import React from 'react';

import { PeacePlotColors } from '@/constants/peaceplot-theme';

export default function EstimateStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: PeacePlotColors.background },
      }}
    />
  );
}
