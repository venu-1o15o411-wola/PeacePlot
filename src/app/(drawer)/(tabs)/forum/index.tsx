import React from "react";
import { StyleSheet, View } from "react-native";

import { ForumHub } from "@/components/forum-hub";
import { usePeacePlotColors } from "@/context/peaceplot-appearance";

export default function ForumIndexScreen() {
  const colors = usePeacePlotColors();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ForumHub colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
