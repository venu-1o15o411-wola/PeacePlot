import { StyleSheet } from "react-native";

import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

export const HERO_RATIO = 0.6;
export const WAVE_HEIGHT = 100;
const ICON_BOX = 38;

export function createAuthStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.authJoinBackground },
    page: { flex: 1, backgroundColor: c.authJoinBackground },
    heroWrap: { position: "relative" },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.12)" },
    heroSafe: { position: "absolute", left: 0, right: 0, top: 0 },
    backBtn: { alignSelf: "flex-start", marginLeft: 8, padding: 4 },
    formSheet: { flex: 1, minHeight: 0, backgroundColor: c.authJoinBackground, marginTop: -WAVE_HEIGHT + 8 },
    wave: { position: "absolute", top: -WAVE_HEIGHT + 8, left: 0 },
    formInner: { flex: 1, minHeight: 0, paddingHorizontal: 20, paddingTop: 28, justifyContent: "space-between" },
    formMain: { flexShrink: 1 },
    titleBlock: { marginBottom: 10, alignItems: "center" },
    title: { fontSize: 22, fontWeight: "700", color: c.text, textAlign: "center", marginBottom: 4 },
    subtitle: { fontSize: 14, lineHeight: 18, color: c.textBody, textAlign: "center", maxWidth: 340 },
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
    iconBox: { width: ICON_BOX, height: ICON_BOX, margin: 4, borderRadius: 8, backgroundColor: c.authInputIconBg, alignItems: "center", justifyContent: "center" },
    input: { flex: 1, paddingVertical: 8, paddingRight: 8, fontSize: 16, fontWeight: "600", color: c.text },
    eyeBtn: { padding: 8 },
    forgotRow: { alignSelf: "flex-end", marginBottom: 6, paddingVertical: 2 },
    forgotLink: { color: c.primary, fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
    submitBtn: { backgroundColor: c.primary, borderRadius: 28, paddingVertical: 12, alignItems: "center", justifyContent: "center", marginBottom: 8 },
    submitBtnPressed: { backgroundColor: c.primaryHover },
    submitBtnDisabled: { opacity: 0.7 },
    submitLabel: { color: c.textOnPrimary, fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
    footerRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", paddingTop: 4 },
    footerMuted: { color: c.textMuted, fontSize: 14 },
    footerLink: { color: c.primary, fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
  });
}
