import Ionicons from "@expo/vector-icons/Ionicons";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import Constants from "expo-constants";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { PeacePlotPalette } from "@/theme/peaceplot-theme";
import {
  usePeacePlotAppearance,
  usePeacePlotColors,
} from "@/providers/peaceplot-appearance";
import { supabase } from "@/lib/supabase";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

const ON_PRIMARY_HEADER = "#ffffff";

function createDrawerStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.drawerBody,
    },
    userHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 18,
      paddingVertical: 20,
      backgroundColor: c.drawerHeaderBlue,
    },
    avatarWrap: {
      width: 56,
      height: 56,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.85)",
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    userTextCol: {
      flex: 1,
    },
    greeting: {
      fontSize: 13,
      color: "rgba(255,255,255,0.9)",
      fontWeight: "500",
    },
    userName: {
      fontSize: 20,
      fontWeight: "700",
      color: ON_PRIMARY_HEADER,
      marginTop: 2,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.2,
      color: c.textMuted,
      paddingHorizontal: 20,
      marginTop: 18,
      marginBottom: 10,
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    menuRowPressed: {
      backgroundColor: c.pressHighlight,
    },
    menuLabel: {
      flex: 1,
      fontSize: 16,
      color: c.textBody,
      fontWeight: "500",
    },
    destructive: {
      color: "#ff8a80",
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    badge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeRed: {
      backgroundColor: "#e53935",
    },
    badgePurple: {
      backgroundColor: "#9237e3",
    },
    badgeText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
    },
    settingsDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 4,
    },
    settingsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    switch: {
      marginLeft: "auto",
    },
    settingsHint: {
      fontSize: 11,
      color: c.textMuted,
      paddingHorizontal: 20,
      marginTop: 4,
      lineHeight: 16,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      paddingHorizontal: 20,
      paddingTop: 16,
      backgroundColor: c.drawerBody,
    },
    footerTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: c.text,
    },
    footerVersion: {
      fontSize: 13,
      color: c.textBody,
      marginTop: 4,
    },
  });
}

export function PeacePlotDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const greeting = useMemo(() => getGreeting(), []);
  const [displayName] = useState("Guest");
  const colors = usePeacePlotColors();
  const { scheme, setScheme } = usePeacePlotAppearance();
  const styles = useMemo(() => createDrawerStyles(colors), [colors]);
  const darkModeOn = scheme === "dark";

  const close = () => props.navigation.closeDrawer();

  const goTabsHome = () => {
    close();
    props.navigation.navigate("(tabs)", { screen: "index" });
  };

  const go = (path: "/profile" | "/journal") => {
    close();
    router.push(path as Href);
  };

  const logout = async () => {
    close();
    try {
      await supabase?.auth.signOut();
    } catch {
      
    }
    router.replace("/signin" as Href);
  };

  const comingSoon = (label: string) => {
    close();
    Alert.alert(label, "This destination will be connected in a later build.");
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.userHeader}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person" size={36} color={ON_PRIMARY_HEADER} />
        </View>
        <View style={styles.userTextCol}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.userName}>{displayName}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>MAIN MENU</Text>

        <MenuRow icon="home-outline" label="Home" onPress={goTabsHome} />
        <MenuRow
          icon="person-outline"
          label="Profile"
          onPress={() => go("/profile")}
        />
        <MenuRow
          icon="book-outline"
          label="Journal"
          onPress={() => go("/journal")}
        />
        <MenuRow
          icon="notifications-outline"
          label="Notification"
          onPress={() => comingSoon("Notifications")}
          badge={1}
          badgeTone="red"
        />
        <MenuRow
          icon="chatbubble-outline"
          label="Chat"
          onPress={() => comingSoon("Chat")}
          badge={5}
          badgeTone="purple"
        />
        <MenuRow
          icon="log-out-outline"
          label="Logout"
          onPress={logout}
          destructive
        />

        <View style={styles.settingsDivider} />
        <Text style={styles.sectionLabel}>SETTINGS</Text>

        <View style={styles.settingsRow}>
          <Ionicons name="moon-outline" size={22} color={colors.text} />
          <Text style={styles.menuLabel}>Dark Mode</Text>
          <Switch
            value={darkModeOn}
            onValueChange={(v) => setScheme(v ? "dark" : "light")}
            trackColor={{ false: "#767577", true: colors.primary }}
            thumbColor="#f4f3f4"
            ios_backgroundColor="#3e3e3e"
            style={styles.switch}
          />
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        <Text style={styles.footerTitle}>PeacePlot</Text>
        <Text style={styles.footerVersion}>App Version {APP_VERSION}</Text>
      </View>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  destructive,
  badge,
  badgeTone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  badge?: number;
  badgeTone?: "red" | "purple";
}) {
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createDrawerStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        pressed && styles.menuRowPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons
        name={icon}
        size={22}
        color={destructive ? "#ff8a80" : colors.text}
      />
      <Text style={[styles.menuLabel, destructive && styles.destructive]}>
        {label}
      </Text>
      <View style={styles.rowRight}>
        {badge != null && badge > 0 ? (
          <View
            style={[
              styles.badge,
              badgeTone === "purple" ? styles.badgePurple : styles.badgeRed,
            ]}
          >
            <Text style={styles.badgeText}>
              {badge > 99 ? "99+" : String(badge)}
            </Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}
