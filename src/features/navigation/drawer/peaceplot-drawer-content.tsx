import Ionicons from "@expo/vector-icons/Ionicons";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import Constants from "expo-constants";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DrawerMenuRow } from "@/features/navigation/drawer/components/drawer-menu-row";
import { ON_PRIMARY_HEADER, createDrawerStyles } from "@/features/navigation/drawer/drawer-styles";
import { useAuth } from "@/providers/auth-session";
import { usePeacePlotAppearance, usePeacePlotColors } from "@/providers/peaceplot-appearance";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export function PeacePlotDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = usePeacePlotColors();
  const { scheme, setScheme } = usePeacePlotAppearance();
  const { user, signOut, isSupabaseConfigured } = useAuth();
  const styles = useMemo(() => createDrawerStyles(colors), [colors]);
  const displayName = useMemo(() => {
    const meta = user?.user_metadata as { userid?: string } | undefined;
    return meta?.userid?.trim() || user?.email?.split("@")[0] || "Guest";
  }, [user]);
  const close = () => props.navigation.closeDrawer();
  const go = (href: Href) => {
    close();
    router.push(href);
  };
  const logout = async () => {
    close();
    try {
      if (isSupabaseConfigured) await signOut();
    } catch (e) {
      return Alert.alert("Sign out failed", e instanceof Error ? e.message : "Unknown error");
    }
    router.replace("/signin" as Href);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.userHeader}>
        <View style={styles.avatarWrap}><Ionicons name="person" size={36} color={ON_PRIMARY_HEADER} /></View>
        <View style={styles.userTextCol}><Text style={styles.greeting}>Welcome</Text><Text style={styles.userName}>{displayName}</Text></View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>MAIN MENU</Text>
        <DrawerMenuRow icon="home-outline" label="Home" onPress={() => { close(); props.navigation.navigate("(tabs)", { screen: "index" }); }} textColor={colors.text} mutedColor={colors.textMuted} styles={styles} />
        <DrawerMenuRow icon="person-outline" label="Profile" onPress={() => { close(); props.navigation.navigate("(tabs)", { screen: "profile" }); }} textColor={colors.text} mutedColor={colors.textMuted} styles={styles} />
        <DrawerMenuRow icon="book-outline" label="Journal" onPress={() => go("/journal" as Href)} textColor={colors.text} mutedColor={colors.textMuted} styles={styles} />
        <DrawerMenuRow icon="notifications-outline" label="Notifications" onPress={() => go("/notifications" as Href)} textColor={colors.text} mutedColor={colors.textMuted} styles={styles} badge={1} />
        <DrawerMenuRow icon="log-out-outline" label="Logout" onPress={logout} textColor={colors.text} mutedColor={colors.textMuted} styles={styles} destructive />
        <View style={styles.settingsDivider} />
        <Text style={styles.sectionLabel}>SETTINGS</Text>
        <View style={styles.settingsRow}>
          <Ionicons name="moon-outline" size={22} color={colors.text} />
          <Text style={styles.menuLabel}>Dark Mode</Text>
          <Switch value={scheme === "dark"} onValueChange={(v) => setScheme(v ? "dark" : "light")} trackColor={{ false: "#767577", true: colors.primary }} thumbColor="#f4f3f4" ios_backgroundColor="#3e3e3e" style={styles.switch} />
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Text style={styles.footerTitle}>PeacePlot</Text>
        <Text style={styles.footerVersion}>App Version {APP_VERSION}</Text>
      </View>
    </View>
  );
}
