import { Image } from "expo-image";
import React, { useEffect } from "react";
import { Text } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  styles: ReturnType<typeof import("@/features/welcome/styles/welcome-styles").createWelcomeStyles>;
};

export function SplashContent({ styles }: Props) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) return;
    scale.value = withRepeat(withSequence(withTiming(1.04, { duration: 2200, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) })), -1, true);
  }, [reduceMotion, scale]);
  const imageAnim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <SafeAreaView style={styles.splashRoot} edges={["top", "bottom"]}>
      <Animated.View style={[styles.splashImageWrap, imageAnim]}>
        <Image source={require("../../../../assets/images/brand/peaceplot-loading.png")} style={styles.splashImage} contentFit="contain" />
      </Animated.View>
      <Text style={styles.splashTagline}>YOUR PATH TO STRESS-FREE LIVING</Text>
    </SafeAreaView>
  );
}
