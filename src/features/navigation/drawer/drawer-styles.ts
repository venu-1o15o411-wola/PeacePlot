import { StyleSheet } from "react-native";

import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

export const ON_PRIMARY_HEADER = "#ffffff";

export function createDrawerStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.drawerBody },
    userHeader: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingVertical: 20, backgroundColor: c.drawerHeaderBlue },
    avatarWrap: { width: 56, height: 56, borderRadius: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.85)", backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
    userTextCol: { flex: 1 },
    greeting: { fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: "500" },
    userName: { fontSize: 20, fontWeight: "700", color: ON_PRIMARY_HEADER, marginTop: 2 },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 24 },
    sectionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, color: c.textMuted, paddingHorizontal: 20, marginTop: 18, marginBottom: 10 },
    menuRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 20 },
    menuRowPressed: { backgroundColor: c.pressHighlight },
    menuLabel: { flex: 1, fontSize: 16, color: c.textBody, fontWeight: "500" },
    destructive: { color: "#ff8a80" },
    rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: "center", justifyContent: "center", backgroundColor: "#e53935" },
    badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
    settingsDivider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginHorizontal: 20, marginTop: 16, marginBottom: 4 },
    settingsRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 20 },
    switch: { marginLeft: "auto" },
    footer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border, paddingHorizontal: 20, paddingTop: 16, backgroundColor: c.drawerBody },
    footerTitle: { fontSize: 16, fontWeight: "800", color: c.text },
    footerVersion: { fontSize: 13, color: c.textBody, marginTop: 4 },
  });
}
