import { StyleSheet } from "react-native";

import type { FingerSignalError } from "@/lib/finger-engine.native";
import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

export function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    root: { flex: 1 },
    body: { flex: 1, paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
    lead: { fontSize: 15, lineHeight: 22, color: c.textBody },
    previewWrap: {
      flex: 1,
      minHeight: 280,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceDeep,
    },
    preview: { flex: 1 },
    hintOverlay: {
      position: "absolute",
      left: 12,
      right: 12,
      top: 12,
      padding: 10,
      borderRadius: 10,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    hintText: { color: "#fff", fontSize: 13, lineHeight: 18 },
    progressWrap: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 14,
      gap: 8,
    },
    progressTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.24)",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: c.primaryLight2,
    },
    progressText: { color: "#fff", fontSize: 12, fontWeight: "600" },
    statusChip: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: "rgba(10, 24, 46, 0.55)",
    },
    statusChipText: { color: c.textMuted, fontSize: 12, fontWeight: "600" },
    controlsCard: {
      marginTop: 4,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: "rgba(10, 24, 46, 0.5)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
      gap: 12,
    },
    primaryBtn: {
      backgroundColor: c.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    primaryBtnText: { color: c.textOnPrimary, fontSize: 16, fontWeight: "700" },
    secondaryBtn: {
      alignSelf: "center",
      backgroundColor: c.buttonSecondaryBg,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    secondaryBtnText: { color: c.text, fontSize: 15, fontWeight: "600" },
    muted: { fontSize: 13, color: c.textMuted, textAlign: "center", lineHeight: 18 },
    error: { fontSize: 14, color: "#f48fb1", lineHeight: 20, textAlign: "center" },
    analyzingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 8,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      padding: 24,
    },
    modalCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 22,
      gap: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: "700", color: c.text },
    modalScore: { fontSize: 40, fontWeight: "800", color: c.primaryLight2 },
    modalBand: { fontSize: 16, fontWeight: "600", color: c.text },
    modalNote: { fontSize: 13, lineHeight: 19, color: c.textMuted },
    modalActions: { gap: 10, marginTop: 8 },
  });
}

export function toErrorCopy(error: FingerSignalError): string {
  if (error === "NO_FINGER") {
    return "We couldn't detect a stable finger seal over the lens and flash. Cover both fully and try again.";
  }
  if (error === "LOW_SIGNAL") {
    return "The pulse signal was too weak or noisy. Keep still with even pressure and try again.";
  }
  return "The capture was too short for a reliable estimate. Keep your finger in place for the full timer.";
}

export function bandLabel(band: "low" | "moderate" | "elevated"): string {
  return band.charAt(0).toUpperCase() + band.slice(1);
}
