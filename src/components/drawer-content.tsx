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

import { PeacePlotColors } from "@/constants/peaceplot-theme";
import { supabase } from "@/lib/supabase";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export function PeacePlotDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const greeting = useMemo(() => getGreeting(), []);
  /** Placeholder until Supabase profile supplies `display_name`. */
  const [displayName] = useState("Guest");
  const [darkModeOn, setDarkModeOn] = useState(true);

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
      /* still navigate to sign-in */
    }
    router.replace("/signin" as Href);
  };

  const comingSoon = (label: string) => {
    close();
    Alert.alert(label, "This destination will be connected in a later build.");
  };

  const colorTheme = () => {
    close();
    Alert.alert(
      "Color theme",
      "Accent and theme presets will follow the plan (dark + blue default).",
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Blue user header — Soziety-style */}
      <View style={styles.userHeader}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person" size={36} color={PeacePlotColors.text} />
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

        <MenuRow
          icon="color-palette-outline"
          label="Color Theme"
          onPress={colorTheme}
        />
        <View style={styles.settingsRow}>
          <Ionicons
            name="moon-outline"
            size={22}
            color={PeacePlotColors.text}
          />
          <Text style={styles.menuLabel}>Dark Mode</Text>
          <Switch
            value={darkModeOn}
            onValueChange={setDarkModeOn}
            trackColor={{ false: "#767577", true: "#9237e3" }}
            thumbColor={darkModeOn ? "#f4f3f4" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            style={styles.switch}
          />
        </View>
        <Text style={styles.settingsHint}>
          Product default stays dark + blue (plan §2.2). Full theme switching
          can sync app-wide later.
        </Text>
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
        color={destructive ? "#ff8a80" : PeacePlotColors.text}
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
        <Ionicons
          name="chevron-forward"
          size={18}
          color={PeacePlotColors.textMuted}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PeacePlotColors.drawerBody,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 20,
    backgroundColor: PeacePlotColors.drawerHeaderBlue,
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
    color: PeacePlotColors.text,
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
    color: PeacePlotColors.textMuted,
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
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: PeacePlotColors.textBody,
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
    backgroundColor: PeacePlotColors.border,
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
    color: PeacePlotColors.textMuted,
    paddingHorizontal: 20,
    marginTop: 4,
    lineHeight: 16,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PeacePlotColors.border,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: PeacePlotColors.drawerBody,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: PeacePlotColors.text,
  },
  footerVersion: {
    fontSize: 13,
    color: PeacePlotColors.textBody,
    marginTop: 4,
  },
});
