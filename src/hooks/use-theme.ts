import { usePeacePlotAppearance } from "@/context/peaceplot-appearance";
import { PeacePlotPalettes } from "@/constants/peaceplot-theme";

/**
 * Legacy shape for `ThemedText` / `ThemedView` — follows drawer **Dark Mode** preference
 * (`PeacePlotAppearanceProvider`), not only OS `useColorScheme`.
 */
export function useTheme() {
  const { scheme } = usePeacePlotAppearance();
  const p = PeacePlotPalettes[scheme];
  return {
    text: p.text,
    background: p.background,
    backgroundElement: p.card,
    backgroundSelected:
      scheme === "dark" ? "rgba(255,255,255,0.08)" : "#e0e4eb",
    textSecondary: p.textBody,
  };
}
