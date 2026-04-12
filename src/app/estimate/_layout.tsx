import { Stack } from "expo-router";
import React, { useMemo } from "react";

import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

export default function EstimateStackLayout() {
  const colors = usePeacePlotColors();
  const screenOptions = useMemo(
    () => ({
      headerShown: false as const,
      contentStyle: { backgroundColor: colors.background },
    }),
    [colors.background],
  );

  return <Stack screenOptions={screenOptions} />;
}
