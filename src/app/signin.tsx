/**
 * Sign-in — layout from `design/xhtml/login.html` (welcome-area + join-area).
 * Styling aligned with `signup.tsx` / PeacePlot theme (§2.2).
 */
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { Href } from "expo-router";
import { Link, router, Stack } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { PeacePlotColors } from "@/constants/peaceplot-theme";
import { supabase } from "@/lib/supabase";

const HERO_RATIO = 0.6;
const WAVE_HEIGHT = 100;
const ICON_BOX = 38;

export default function SigninScreen() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(height * HERO_RATIO);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function onSignIn() {
    const em = email.trim();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      Alert.alert("Email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 1) {
      Alert.alert("Password", "Please enter your password.");
      return;
    }

    if (!supabase) {
      Alert.alert(
        "PeacePlot",
        "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to `.env`.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: em,
        password,
      });
      if (error) {
        Alert.alert("Sign in failed", error.message);
        return;
      }
      router.replace("/(drawer)/(tabs)" as Href);
    } catch (e) {
      Alert.alert(
        "Sign in failed",
        e instanceof Error ? e.message : "Unknown error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function onSocialPlaceholder(provider: string) {
    Alert.alert(
      provider,
      "OAuth sign-in will be wired per plan §4.4 (Google, Microsoft, Apple).",
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.page}>
          <View style={[styles.heroWrap, { height: heroHeight, width }]}>
            <Image
              source={require("../../assets/images/login/pic4.jpg")}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <View style={styles.heroOverlay} />
            <SafeAreaView edges={["top"]} style={styles.heroSafe}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.backBtn,
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons
                  name="chevron-back"
                  size={28}
                  color={PeacePlotColors.text}
                />
              </Pressable>
            </SafeAreaView>
          </View>

          <View
            style={[
              styles.formSheet,
              { width, paddingBottom: Math.max(insets.bottom, 8) },
            ]}
          >
            <Image
              source={require("../../assets/images/login/bg-shape-dark.png")}
              style={[styles.wave, { width, height: WAVE_HEIGHT }]}
              contentFit="fill"
            />

            <View style={styles.formInner}>
              <View style={styles.formMain}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Sign in</Text>
                <Text style={styles.subtitle}>
                  Welcome back—sign in to continue your path to calmer days with
                  PeacePlot.
                </Text>
              </View>

              <View style={styles.field}>
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="mail" size={20} color={PeacePlotColors.text} />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor={PeacePlotColors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}>
                    <Ionicons
                      name="lock-closed"
                      size={20}
                      color={PeacePlotColors.text}
                    />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor={PeacePlotColors.textMuted}
                    secureTextEntry={secure}
                    style={styles.input}
                  />
                  <Pressable
                    onPress={() => setSecure((s) => !s)}
                    style={styles.eyeBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={secure ? "Show password" : "Hide password"}
                  >
                    <Ionicons
                      name={secure ? "eye-off" : "eye"}
                      size={22}
                      color={PeacePlotColors.primary}
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Forgot password",
                    "Recovery flow will match plan §4.4 (email reset via Supabase).",
                  )
                }
                style={styles.forgotRow}
              >
                <Text style={styles.forgotLink}>Forgot Password</Text>
              </Pressable>

              <Pressable
                onPress={onSignIn}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.signInBtn,
                  pressed && styles.signInBtnPressed,
                  submitting && styles.signInBtnDisabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={PeacePlotColors.text} />
                ) : (
                  <Text style={styles.signInLabel}>SIGN IN</Text>
                )}
              </Pressable>

              <View style={styles.socialBox}>
                <Text style={styles.socialHint}>Or sign in with</Text>
                <View style={styles.socialRow}>
                  <Pressable
                    onPress={() => onSocialPlaceholder("Facebook")}
                    style={styles.socialHit}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in with Facebook"
                  >
                    <Image
                      source={require("../../assets/images/login/facebook.png")}
                      style={styles.socialIcon}
                      contentFit="contain"
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => onSocialPlaceholder("Google")}
                    style={styles.socialHit}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in with Google"
                  >
                    <Image
                      source={require("../../assets/images/login/google.png")}
                      style={styles.socialIcon}
                      contentFit="contain"
                    />
                  </Pressable>
                </View>
              </View>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.footerMuted}>
                  {"Don't have an account? "}
                </Text>
                <Link href="/signup" asChild>
                  <Pressable>
                    <Text style={styles.footerLink}>Signup here</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: PeacePlotColors.background,
  },
  page: {
    flex: 1,
    backgroundColor: PeacePlotColors.background,
  },
  heroWrap: {
    position: "relative",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  heroSafe: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  },
  backBtn: {
    alignSelf: "flex-start",
    marginLeft: 8,
    padding: 4,
  },
  formSheet: {
    flex: 1,
    minHeight: 0,
    backgroundColor: PeacePlotColors.background,
    marginTop: -WAVE_HEIGHT + 8,
  },
  wave: {
    position: "absolute",
    top: -WAVE_HEIGHT + 8,
    left: 0,
  },
  formInner: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 20,
    paddingTop: 28,
    justifyContent: "space-between",
  },
  formMain: {
    flexShrink: 1,
  },
  titleBlock: {
    marginBottom: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: PeacePlotColors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    color: PeacePlotColors.textBody,
    textAlign: "center",
    maxWidth: 340,
  },
  field: {
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PeacePlotColors.border,
    borderRadius: 12,
    backgroundColor: PeacePlotColors.card,
    paddingRight: 8,
    minHeight: 46,
  },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    margin: 4,
    borderRadius: 8,
    backgroundColor: PeacePlotColors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingRight: 8,
    fontSize: 16,
    fontWeight: "600",
    color: PeacePlotColors.text,
  },
  eyeBtn: {
    padding: 8,
  },
  forgotRow: {
    alignSelf: "flex-end",
    marginBottom: 6,
    paddingVertical: 2,
  },
  forgotLink: {
    color: PeacePlotColors.primary,
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  signInBtn: {
    backgroundColor: PeacePlotColors.primary,
    borderRadius: 28,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  signInBtnPressed: {
    backgroundColor: PeacePlotColors.primaryHover,
  },
  signInBtnDisabled: {
    opacity: 0.7,
  },
  signInLabel: {
    color: PeacePlotColors.text,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  socialBox: {
    alignItems: "center",
    marginBottom: 0,
  },
  socialHint: {
    fontSize: 13,
    color: PeacePlotColors.textMuted,
    marginBottom: 6,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  socialHit: {
    padding: 4,
  },
  socialIcon: {
    width: 44,
    height: 44,
  },
  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 4,
  },
  footerMuted: {
    color: PeacePlotColors.textMuted,
    fontSize: 14,
  },
  footerLink: {
    color: PeacePlotColors.primary,
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
