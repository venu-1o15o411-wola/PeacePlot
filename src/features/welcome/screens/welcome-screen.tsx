import { Image } from "expo-image";
import type { Href } from "expo-router";
import { Redirect, Stack, router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SplashContent } from "@/features/welcome/components/splash-content";
import { WelcomeCarousel } from "@/features/welcome/components/welcome-carousel";
import { HERO_RATIO, SPLASH_MS, WAVE_HEIGHT, SLIDES } from "@/features/welcome/constants/welcome-slides";
import { createWelcomeStyles } from "@/features/welcome/styles/welcome-styles";
import { useAuth } from "@/providers/auth-session";
import { usePeacePlotAppearance, usePeacePlotColors } from "@/providers/peaceplot-appearance";

export function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(height * HERO_RATIO);
  const [phase, setPhase] = useState<"splash" | "welcome">("splash");
  const [index, setIndex] = useState(0);
  const colors = usePeacePlotColors();
  const { scheme } = usePeacePlotAppearance();
  const { session, loading, isSupabaseConfigured } = useAuth();
  const styles = useMemo(() => createWelcomeStyles(colors), [colors]);
  const waveSource = scheme === "dark" ? require("../../../../assets/images/auth/bg-shape-dark.png") : require("../../../../assets/images/auth/bg-shape.png");

  useEffect(() => {
    if (loading || (isSupabaseConfigured && session)) return;
    const t = setTimeout(() => setPhase("welcome"), SPLASH_MS);
    return () => clearTimeout(t);
  }, [loading, isSupabaseConfigured, session]);

  const onCarouselScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / Math.max(width, 1));
    setIndex(Math.min(SLIDES.length - 1, Math.max(0, i)));
  }, [width]);

  if (loading) return <View style={[styles.page, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (isSupabaseConfigured && session) return <Redirect href="/(drawer)/(tabs)" />;
  if (phase === "splash") return <><Stack.Screen options={{ headerShown: false }} /><SplashContent styles={styles} /></>;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.page}>
        <View style={[styles.heroWrap, { height: heroHeight, width }]}>
          <Image source={require("../../../../assets/images/auth/pic1.jpg")} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.heroOverlay} />
        </View>
        <View style={[styles.joinArea, { width, paddingBottom: Math.max(insets.bottom, 8) }]}>
          <Image source={waveSource} style={[styles.wave, { width, height: WAVE_HEIGHT }]} contentFit="fill" />
          <View style={styles.joinInner}>
            <WelcomeCarousel width={width} index={index} styles={styles} onScrollEnd={onCarouselScroll} />
            <Pressable onPress={() => router.push("/signup" as Href)} style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}><Text style={styles.btnPrimaryLabel}>CREATE ACCOUNT</Text></Pressable>
            <Pressable onPress={() => router.push("/signin" as Href)} style={({ pressed }) => [styles.btnLight, pressed && styles.btnLightPressed]}><Text style={styles.btnLightLabel}>SIGN IN</Text></Pressable>
            <Pressable onPress={() => Alert.alert("Forgot account", "Password recovery follows the sign-in flow.")} style={styles.forgotWrap}><Text style={styles.forgotText}>Forgot your account?</Text></Pressable>
          </View>
        </View>
      </View>
    </>
  );
}
