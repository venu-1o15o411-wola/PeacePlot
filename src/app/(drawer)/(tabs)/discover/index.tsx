import React from "react";
import { StyleSheet, View } from "react-native";

import { DiscoverLibrary } from "@/components/discover-library";
import { usePeacePlotColors } from "@/context/peaceplot-appearance";

export default function DiscoverIndexScreen() {
  const colors = usePeacePlotColors();
  return (
    <View
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <DiscoverLibrary colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
