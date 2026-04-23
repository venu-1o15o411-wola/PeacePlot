import { StyleSheet } from "react-native";

import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

export function createTabBarStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    bar: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      paddingHorizontal: 6,
      paddingTop: 10,
      backgroundColor: c.tabBarBackground,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, minHeight: 48, paddingHorizontal: 2 },
    label: { fontSize: 10, color: c.textMuted, fontWeight: "500" },
    labelFocused: { color: c.primaryLight2 },
    centerFabWrap: { flex: 1, alignItems: "center", justifyContent: "flex-end", paddingBottom: 2 },
    centerFab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
      borderWidth: 3,
      borderColor: c.measureRing,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
      marginTop: -24,
    },
    centerFabActive: { backgroundColor: c.primaryHover, borderColor: c.primaryLight2 },
  });
}
