import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { createStyles } from "@/components/estimate/finger-measure-flow-common";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

export function FingerMeasureFlow({ onBack }: { onBack: () => void }) {
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.body}>
      <Text style={styles.lead}>
        Finger PPG needs a custom dev build (not the Expo Go app): back camera, flash, and Vision
        Camera frame processors. Build with npx expo run:ios, then open that app and use npx expo
        start --dev-client.
      </Text>
      <Pressable style={styles.secondaryBtn} onPress={onBack} accessibilityRole="button">
        <Text style={styles.secondaryBtnText}>Go back</Text>
      </Pressable>
    </View>
  );
}

export default FingerMeasureFlow;
