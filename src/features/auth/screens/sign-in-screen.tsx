import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, Redirect, Stack, router } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { PasswordField } from "@/features/auth/components/password-field";
import { useSignInForm } from "@/features/auth/hooks/use-sign-in-form";
import { HERO_RATIO, WAVE_HEIGHT, createAuthStyles } from "@/features/auth/styles/auth-form-styles";
import { useAuth } from "@/providers/auth-session";
import { usePeacePlotAppearance, usePeacePlotColors } from "@/providers/peaceplot-appearance";

export function SignInScreen() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(height * HERO_RATIO);
  const colors = usePeacePlotColors();
  const { scheme } = usePeacePlotAppearance();
  const styles = useMemo(() => createAuthStyles(colors), [colors]);
  const { session, loading, isSupabaseConfigured, signInWithPassword, resetPasswordForEmail } = useAuth();
  const form = useSignInForm();
  const waveSource = scheme === "dark" ? require("../../../../assets/images/auth/bg-shape-dark.png") : require("../../../../assets/images/auth/bg-shape.png");

  const onSignIn = async () => {
    const email = form.email.trim();
    if (!email || !form.password) return Alert.alert("Sign in", "Enter your email and password.");
    if (!isSupabaseConfigured) return Alert.alert("Supabase not configured", "Add Supabase env keys then restart Expo.");
    form.setSubmitting(true);
    try {
      await signInWithPassword(email, form.password);
    } catch (e) {
      Alert.alert("Sign in failed", e instanceof Error ? e.message : "Unknown error");
    } finally {
      form.setSubmitting(false);
    }
  };
  const onForgot = async () => {
    const email = form.email.trim();
    if (!email) return Alert.alert("Forgot password", "Enter your email first.");
    try {
      await resetPasswordForEmail(email);
      Alert.alert("Check your email", "If the account exists, a reset link was sent.");
    } catch (e) {
      Alert.alert("Reset failed", e instanceof Error ? e.message : "Unknown error");
    }
  };

  if (!loading && isSupabaseConfigured && session) return <Redirect href="/(drawer)/(tabs)" />;
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.page}>
          <View style={[styles.heroWrap, { height: heroHeight, width }]}>
            <Image source={require("../../../../assets/images/auth/pic4.jpg")} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.heroOverlay} />
            <SafeAreaView edges={["top"]} style={styles.heroSafe}>
              <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
                <Ionicons name="chevron-back" size={28} color={colors.text} />
              </Pressable>
            </SafeAreaView>
          </View>
          <View style={[styles.formSheet, { width, paddingBottom: Math.max(insets.bottom, 8) }]}>
            <Image source={waveSource} style={[styles.wave, { width, height: WAVE_HEIGHT }]} contentFit="fill" />
            <View style={styles.formInner}>
              <View style={styles.formMain}>
                <View style={styles.titleBlock}><Text style={styles.title}>Sign in</Text><Text style={styles.subtitle}>Welcome back to PeacePlot.</Text></View>
                <AuthTextField icon="mail" value={form.email} onChangeText={form.setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} iconColor={colors.authInputIconFg} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} styles={styles} />
                <PasswordField value={form.password} onChangeText={form.setPassword} secure={form.secure} onToggleSecure={form.toggleSecure} colors={colors} styles={styles} />
                <Pressable onPress={onForgot} style={styles.forgotRow}><Text style={styles.forgotLink}>Forgot Password</Text></Pressable>
                <Pressable onPress={onSignIn} disabled={form.submitting} style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed, form.submitting && styles.submitBtnDisabled]}>
                  {form.submitting ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.submitLabel}>SIGN IN</Text>}
                </Pressable>
              </View>
              <View style={styles.footerRow}>
                <Text style={styles.footerMuted}>{"Don't have an account? "}</Text>
                <Link href="/signup" asChild><Pressable><Text style={styles.footerLink}>Signup here</Text></Pressable></Link>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
