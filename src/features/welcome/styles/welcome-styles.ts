import { Dimensions, StyleSheet } from "react-native";

import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

import { WAVE_HEIGHT } from "@/features/welcome/constants/welcome-slides";

export const maxContent = Dimensions.get("window").width > 420 ? 360 : Dimensions.get("window").width - 48;
export const splashMaxHeight = Math.min(Dimensions.get("window").height * 0.38, 320);

export function createWelcomeStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    splashRoot: { flex: 1, backgroundColor: c.authJoinBackground, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
    splashImageWrap: { width: maxContent, maxWidth: 360, aspectRatio: 1, maxHeight: splashMaxHeight },
    splashImage: { width: "100%", height: "100%" },
    splashTagline: { marginTop: 28, fontSize: 13, fontWeight: "700", letterSpacing: 1.2, color: c.primaryLight2, textAlign: "center" },
    page: { flex: 1, backgroundColor: c.authJoinBackground },
    heroWrap: { position: "relative" },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.1)" },
    joinArea: { flex: 1, minHeight: 0, backgroundColor: c.authJoinBackground, marginTop: -WAVE_HEIGHT + 8 },
    wave: { position: "absolute", top: -WAVE_HEIGHT + 8, left: 0 },
    joinInner: { flex: 1, paddingHorizontal: 20, paddingTop: 28, justifyContent: "space-between" },
    slideTitle: { fontSize: 22, fontWeight: "700", color: c.text, textAlign: "center", marginBottom: 6 },
    slideBody: { fontSize: 14, lineHeight: 19, color: c.textBody, textAlign: "center", maxWidth: 320, alignSelf: "center" },
    pagination: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 6, marginBottom: 8 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.dotInactive },
    dotActive: { backgroundColor: c.primary, width: 22 },
    btnPrimary: { backgroundColor: c.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginBottom: 8 },
    btnPrimaryPressed: { backgroundColor: c.primaryHover },
    btnPrimaryLabel: { color: c.textOnPrimary, fontSize: 16, fontWeight: "800" },
    btnLight: { backgroundColor: c.buttonSecondaryBg, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginBottom: 6 },
    btnLightPressed: { backgroundColor: c.buttonSecondaryBgPressed },
    btnLightLabel: { color: c.text, fontSize: 16, fontWeight: "700" },
    forgotWrap: { alignItems: "center", paddingVertical: 2 },
    forgotText: { color: c.textBody, fontSize: 14, textAlign: "center" },
  });
}
