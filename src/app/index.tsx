/**
 * Welcome & launch — structure from `design/xhtml/welcome.html`:
 * splash (loader-screen) → welcome-area (hero + join-area: swiper, CTAs).
 */
import { Image } from "expo-image";
import type { Href } from "expo-router";
import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import type { PeacePlotPalette } from "@/constants/peaceplot-theme";
import {
  usePeacePlotAppearance,
  usePeacePlotColors,
} from "@/context/peaceplot-appearance";

const HERO_RATIO = 0.6;
const WAVE_HEIGHT = 100;
const SPLASH_MS = 2600;

const TAGLINE = "YOUR PATH TO STRESS-FREE LIVING";

const SLIDES: { title: string; body: string }[] = [
  {
    title: "Hello, and welcome to PeacePlot.",
    body: "Take a breath—this is your space to understand stress and move toward calmer days.",
  },
  {
    title: "Science-informed, human-centered.",
    body: "Explore estimation tools, trusted guidance, and content that fits your pace.",
  },
  {
    title: "Grow with community and rest.",
    body: "Connect in the forum, wind down for sleep, and build habits that last.",
  },
];

/** Carousel viewport height — layout-only (not hero ratio); kept compact for one-screen fit. */
const CAROUSEL_H = 172;

function createWelcomeStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    splashRoot: {
      flex: 1,
      backgroundColor: c.authJoinBackground,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    splashImageWrap: {
      width: maxContent,
      maxWidth: 360,
      aspectRatio: 1,
      maxHeight: heightForSplash(),
    },
    splashImage: {
      width: "100%",
      height: "100%",
    },
    splashTagline: {
      marginTop: 28,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 1.2,
      color: c.primaryLight2,
      textAlign: "center",
    },
    page: {
      flex: 1,
      backgroundColor: c.authJoinBackground,
    },
    heroWrap: {
      position: "relative",
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.1)",
    },
    joinArea: {
      flex: 1,
      minHeight: 0,
      backgroundColor: c.authJoinBackground,
      marginTop: -WAVE_HEIGHT + 8,
    },
    wave: {
      position: "absolute",
      top: -WAVE_HEIGHT + 8,
      left: 0,
    },
    joinInner: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 28,
      justifyContent: "space-between",
    },
    joinMain: {
      flex: 1,
      minHeight: 0,
      justifyContent: "flex-start",
    },
    carouselBlock: {
      marginBottom: 8,
    },
    slide: {
      paddingHorizontal: 8,
    },
    started: {
      alignItems: "center",
      paddingBottom: 4,
      justifyContent: "center",
      flex: 1,
    },
    slideTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: c.text,
      textAlign: "center",
      marginBottom: 6,
    },
    slideBody: {
      fontSize: 14,
      lineHeight: 19,
      color: c.textBody,
      textAlign: "center",
      maxWidth: 320,
      alignSelf: "center",
    },
    pagination: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginTop: 6,
      marginBottom: 4,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.dotInactive,
    },
    dotActive: {
      backgroundColor: c.primary,
      width: 22,
    },
    btnPrimary: {
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      marginBottom: 8,
    },
    btnPrimaryPressed: {
      backgroundColor: c.primaryHover,
    },
    btnPrimaryLabel: {
      color: c.textOnPrimary,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    btnLight: {
      backgroundColor: c.buttonSecondaryBg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      marginBottom: 6,
    },
    btnLightPressed: {
      backgroundColor: c.buttonSecondaryBgPressed,
    },
    btnLightLabel: {
      color: c.text,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    forgotWrap: {
      alignItems: "center",
      paddingVertical: 2,
    },
    forgotText: {
      color: c.textBody,
      fontSize: 14,
      textAlign: "center",
    },
  });
}

const maxContent =
  Dimensions.get("window").width > 420
    ? 360
    : Dimensions.get("window").width - 48;

function heightForSplash() {
  const h = Dimensions.get("window").height;
  return Math.min(h * 0.38, 320);
}

function SplashContent() {
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createWelcomeStyles(colors), [colors]);
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [reduceMotion, scale]);

  const imageAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <SafeAreaView style={styles.splashRoot} edges={["top", "bottom"]}>
      <Animated.View style={[styles.splashImageWrap, imageAnim]}>
        <Image
          source={require("../../assets/images/peaceplot-loading.png")}
          style={styles.splashImage}
          contentFit="contain"
        />
      </Animated.View>
      <Text style={styles.splashTagline}>{TAGLINE}</Text>
    </SafeAreaView>
  );
}

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(height * HERO_RATIO);
  const [phase, setPhase] = useState<"splash" | "welcome">("splash");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const colors = usePeacePlotColors();
  const { scheme } = usePeacePlotAppearance();
  const styles = useMemo(() => createWelcomeStyles(colors), [colors]);

  useEffect(() => {
    const t = setTimeout(() => setPhase("welcome"), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  const onCarouselScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / Math.max(width, 1));
      const clamped = Math.min(SLIDES.length - 1, Math.max(0, idx));
      setCarouselIndex(clamped);
    },
    [width],
  );

  const waveSource =
    scheme === "dark"
      ? require("../../assets/images/login/bg-shape-dark.png")
      : require("../../assets/images/login/bg-shape.png");

  if (phase === "splash") {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SplashContent />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.page}>
        <View style={[styles.heroWrap, { height: heroHeight, width }]}>
          <Image
            source={require("../../assets/images/login/pic1.jpg")}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={styles.heroOverlay} />
        </View>

        <View
          style={[
            styles.joinArea,
            { width, paddingBottom: Math.max(insets.bottom, 8) },
          ]}
        >
          <Image
            source={waveSource}
            style={[styles.wave, { width, height: WAVE_HEIGHT }]}
            contentFit="fill"
          />

          <View style={styles.joinInner}>
            <View style={styles.joinMain}>
              <View style={styles.carouselBlock}>
                <FlatList
                  data={SLIDES}
                  keyExtractor={(_, i) => String(i)}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onCarouselScroll}
                  nestedScrollEnabled
                  renderItem={({ item }) => (
                    <View style={[styles.slide, { width }]}>
                      <View style={styles.started}>
                        <Text style={styles.slideTitle}>{item.title}</Text>
                        <Text style={styles.slideBody}>{item.body}</Text>
                      </View>
                    </View>
                  )}
                  getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                  })}
                  style={{ height: CAROUSEL_H, width }}
                />
                <View style={styles.pagination}>
                  {SLIDES.map((_, i) => (
                    <View
                      key={String(i)}
                      style={[
                        styles.dot,
                        i === carouselIndex && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <Pressable
                onPress={() => router.push("/signup" as Href)}
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && styles.btnPrimaryPressed,
                ]}
              >
                <Text style={styles.btnPrimaryLabel}>CREATE ACCOUNT</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/signin" as Href)}
                style={({ pressed }) => [
                  styles.btnLight,
                  pressed && styles.btnLightPressed,
                ]}
              >
                <Text style={styles.btnLightLabel}>SIGN IN</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() =>
                Alert.alert(
                  "Forgot account",
                  "Password recovery will follow the same flow as sign-in (plan §4.4).",
                )
              }
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Forgot your account?</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}
