import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, router, Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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

import type { PeacePlotPalette } from "@/theme/peaceplot-theme";
import {
  usePeacePlotAppearance,
  usePeacePlotColors,
} from "@/providers/peaceplot-appearance";

const HERO_RATIO = 0.6;
const WAVE_HEIGHT = 100;
const ICON_BOX = 38;

function createSignupStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.authJoinBackground },
    scrollContent: { flexGrow: 1 },
    heroWrap: { position: "relative" },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.12)",
    },
    heroSafe: { position: "absolute", left: 0, right: 0, top: 0 },
    backBtn: { alignSelf: "flex-start", marginLeft: 8, padding: 4 },
    formSheet: {
      backgroundColor: c.authJoinBackground,
      marginTop: -WAVE_HEIGHT + 8,
      paddingBottom: 10,
    },
    wave: { position: "absolute", top: -WAVE_HEIGHT + 8, left: 0 },
    formInner: { paddingHorizontal: 20, paddingTop: 32 },
    titleBlock: { marginBottom: 10, alignItems: "center" },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: c.text,
      textAlign: "center",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 18,
      color: c.textBody,
      textAlign: "center",
      maxWidth: 340,
    },
    field: { marginBottom: 8 },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      backgroundColor: c.surfaceInput,
      paddingRight: 8,
      minHeight: 46,
    },
    iconBox: {
      width: ICON_BOX,
      height: ICON_BOX,
      margin: 4,
      borderRadius: 8,
      backgroundColor: c.authInputIconBg,
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      flex: 1,
      paddingVertical: 8,
      paddingRight: 8,
      fontSize: 16,
      fontWeight: "600",
      color: c.text,
    },
    eyeBtn: { padding: 8 },
    registerBtn: {
      marginTop: 4,
      marginBottom: 10,
      backgroundColor: c.primary,
      borderRadius: 28,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    registerBtnPressed: { backgroundColor: c.primaryHover },
    registerBtnDisabled: { opacity: 0.7 },
    registerLabel: {
      color: c.textOnPrimary,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    footerRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 4,
    },
    footerMuted: { color: c.textMuted, fontSize: 14 },
    footerLink: {
      color: c.primary,
      fontSize: 14,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
  });
}

export default function SignupScreen() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(height * HERO_RATIO);
  const colors = usePeacePlotColors();
  const { scheme } = usePeacePlotAppearance();
  const styles = useMemo(() => createSignupStyles(colors), [colors]);

  const [userid, setUserid] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function onRegister() {
    setSubmitting(true);
    try {
      Alert.alert(
        "PeacePlot",
        "If email confirmation is enabled, check your inbox. You can sign in when your account is ready.",
        [{ text: "OK", onPress: () => router.replace("/signin") }],
      );
    } catch (e) {
      Alert.alert(
        "Sign up failed",
        e instanceof Error ? e.message : "Unknown error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const waveSource =
    scheme === "dark"
      ? require("../../assets/images/auth/bg-shape-dark.png")
      : require("../../assets/images/auth/bg-shape.png");

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 10) + 8 },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.heroWrap, { height: heroHeight, width }]}>
            <Image
              source={require("../../assets/images/auth/pic3.jpg")}
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
                <Ionicons name="chevron-back" size={28} color={colors.text} />
              </Pressable>
            </SafeAreaView>
          </View>

          <View style={[styles.formSheet, { width }]}>
            <Image
              source={waveSource}
              style={[styles.wave, { width, height: WAVE_HEIGHT }]}
              contentFit="fill"
            />

            <View style={styles.formInner}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Create an Account</Text>
                <Text style={styles.subtitle}>
                  Join PeacePlot to track stress, discover calm content, and
                  build healthier habits—aligned with your unique profile.
                </Text>
              </View>

              <View style={styles.field}>
                <View style={styles.inputRow}>
                  <View style={styles.iconBox}>
                    <Ionicons
                      name="person"
                      size={20}
                      color={colors.authInputIconFg}
                    />
                  </View>
                  <TextInput
                    value={userid}
                    onChangeText={setUserid}
                    placeholder="Unique user ID"
                    placeholderTextColor={colors.textMuted}
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
                      name="mail"
                      size={20}
                      color={colors.authInputIconFg}
                    />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor={colors.textMuted}
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
                      color={colors.authInputIconFg}
                    />
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={secure}
                    style={styles.input}
                  />
                  <Pressable
                    onPress={() => setSecure((s) => !s)}
                    style={styles.eyeBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      secure ? "Show password" : "Hide password"
                    }
                  >
                    <Ionicons
                      name={secure ? "eye-off" : "eye"}
                      size={22}
                      color={colors.primary}
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={onRegister}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.registerBtn,
                  pressed && styles.registerBtnPressed,
                  submitting && styles.registerBtnDisabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.registerLabel}>REGISTER</Text>
                )}
              </Pressable>

              <View style={styles.footerRow}>
                <Text style={styles.footerMuted}>
                  Already have an account?{" "}
                </Text>
                <Link href="/signin" asChild>
                  <Pressable>
                    <Text style={styles.footerLink}>Sign in here</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
