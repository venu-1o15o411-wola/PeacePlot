import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, Redirect, Stack, router } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { PasswordField } from "@/features/auth/components/password-field";
import { useSignUpForm } from "@/features/auth/hooks/use-sign-up-form";
import { HERO_RATIO, WAVE_HEIGHT, createAuthStyles } from "@/features/auth/styles/auth-form-styles";
import { useAuth } from "@/providers/auth-session";
import { usePeacePlotAppearance, usePeacePlotColors } from "@/providers/peaceplot-appearance";

export function SignUpScreen() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = Math.round(height * HERO_RATIO);
  const colors = usePeacePlotColors();
  const { scheme } = usePeacePlotAppearance();
  const styles = useMemo(() => createAuthStyles(colors), [colors]);
  const { session, loading, isSupabaseConfigured, signUp } = useAuth();
  const form = useSignUpForm();
  const waveSource = scheme === "dark" ? require("../../../../assets/images/auth/bg-shape-dark.png") : require("../../../../assets/images/auth/bg-shape.png");

  const onRegister = async () => {
    const userid = form.userid.trim();
    const email = form.email.trim();
    if (!userid || !email || !form.password) return Alert.alert("Create account", "Fill all fields.");
    if (!isSupabaseConfigured) return Alert.alert("Supabase not configured", "Add Supabase env keys then restart Expo.");
    form.setSubmitting(true);
    try {
      await signUp({ userid, email, password: form.password });
    } catch (e) {
      Alert.alert("Sign up failed", e instanceof Error ? e.message : "Unknown error");
    } finally {
      form.setSubmitting(false);
    }
  };

  if (!loading && isSupabaseConfigured && session) return <Redirect href="/(drawer)/(tabs)" />;
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 10) + 8 }} showsVerticalScrollIndicator={false} bounces={false}>
          <View style={[styles.heroWrap, { height: heroHeight, width }]}>
            <Image source={require("../../../../assets/images/auth/pic3.jpg")} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.heroOverlay} />
            <SafeAreaView edges={["top"]} style={styles.heroSafe}>
              <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
                <Ionicons name="chevron-back" size={28} color={colors.text} />
              </Pressable>
            </SafeAreaView>
          </View>
          <View style={[styles.formSheet, { width }]}>
            <Image source={waveSource} style={[styles.wave, { width, height: WAVE_HEIGHT }]} contentFit="fill" />
            <View style={styles.formInner}>
              <View style={styles.titleBlock}><Text style={styles.title}>Create an Account</Text><Text style={styles.subtitle}>Join PeacePlot and personalize your journey.</Text></View>
              <AuthTextField icon="person" value={form.userid} onChangeText={form.setUserid} placeholder="Unique user ID" placeholderTextColor={colors.textMuted} iconColor={colors.authInputIconFg} autoCapitalize="none" autoCorrect={false} styles={styles} />
              <AuthTextField icon="mail" value={form.email} onChangeText={form.setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} iconColor={colors.authInputIconFg} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} styles={styles} />
              <PasswordField value={form.password} onChangeText={form.setPassword} secure={form.secure} onToggleSecure={form.toggleSecure} colors={colors} styles={styles} />
              <Pressable onPress={onRegister} disabled={form.submitting} style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed, form.submitting && styles.submitBtnDisabled]}>
                {form.submitting ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.submitLabel}>REGISTER</Text>}
              </Pressable>
              <View style={styles.footerRow}>
                <Text style={styles.footerMuted}>Already have an account? </Text>
                <Link href="/signin" asChild><Pressable><Text style={styles.footerLink}>Sign in here</Text></Pressable></Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
