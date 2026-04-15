import { Stack } from "expo-router";
import React, { useMemo } from "react";

import { PeacePlotAmbientBackground } from "@/components/shell/peaceplot-ambient-background";

export default function EstimateStackLayout() {
  const screenOptions = useMemo(
    () => ({
      headerShown: false as const,
      contentStyle: { backgroundColor: "transparent" },
    }),
    [],
  );

  return (
    <PeacePlotAmbientBackground>
      <Stack screenOptions={screenOptions} />
    </PeacePlotAmbientBackground>
  );
}
