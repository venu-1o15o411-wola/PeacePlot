import React from "react";
import { StyleSheet, View } from "react-native";

import { DiscoverLibrary } from "@/components/discover/discover-library";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

export default function DiscoverIndexScreen() {
  const colors = usePeacePlotColors();
  return (
    <View style={styles.root}>
      <DiscoverLibrary colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
