import type { Theme } from "@react-navigation/native";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";

export type PeacePlotScheme = "light" | "dark";

export type PeacePlotPalette = {
  background: string;
  card: string;
  cardNavSolid: string;
  headerGlass: string;
  primary: string;
  primaryHover: string;
  primaryDark: string;
  primaryLight2: string;
  text: string;
  textBody: string;
  textMuted: string;
  textOnPrimary: string;
  border: string;
  measureRing: string;
  drawerBody: string;
  drawerHeaderBlue: string;
  surfaceInput: string;
  surfaceDeep: string;
  authJoinBackground: string;
  authInputIconBg: string;
  authInputIconFg: string;
  dotInactive: string;
  buttonSecondaryBg: string;
  buttonSecondaryBgPressed: string;
  pressHighlight: string;
  tabBarBackground: string;
};

const DARK_BG = "#243457";
const DARK_BG_RGB = { r: 36, g: 52, b: 87 } as const;

export const PeacePlotPalettes: Record<PeacePlotScheme, PeacePlotPalette> = {
  dark: {
    background: DARK_BG,
    card: "#2d405c",
    cardNavSolid: "#2d405c",
    headerGlass: `rgba(${DARK_BG_RGB.r}, ${DARK_BG_RGB.g}, ${DARK_BG_RGB.b}, 0.92)`,
    primary: "#2196f3",
    primaryHover: "#0c7cd5",
    primaryDark: "#064475",
    primaryLight2: "#8ecdff",
    text: "#ffffff",
    textBody: "rgba(255, 255, 255, 0.7)",
    textMuted: "rgba(255, 255, 255, 0.5)",
    textOnPrimary: "#ffffff",
    border: "rgba(255, 255, 255, 0.2)",
    measureRing: "rgba(33, 150, 243, 0.45)",
    drawerBody: DARK_BG,
    drawerHeaderBlue: "#2196f3",
    surfaceInput: DARK_BG,
    surfaceDeep: "#2d4a6b",
    authJoinBackground: DARK_BG,
    authInputIconBg: "#064475",
    authInputIconFg: "#ffffff",
    dotInactive: "rgba(255, 255, 255, 0.25)",
    buttonSecondaryBg: "rgba(255, 255, 255, 0.12)",
    buttonSecondaryBgPressed: "rgba(255, 255, 255, 0.2)",
    pressHighlight: "rgba(255, 255, 255, 0.06)",
    tabBarBackground: DARK_BG,
  },
  light: {
    background: "#f5f7fb",
    card: "#ffffff",
    cardNavSolid: "#ffffff",
    headerGlass: "rgba(255, 255, 255, 0.94)",
    primary: "#2196f3",
    primaryHover: "#0c7cd5",
    primaryDark: "#064475",
    primaryLight2: "#8ecdff",
    text: "#2f2f2f",
    textBody: "rgba(0, 0, 0, 0.65)",
    textMuted: "#64748b",
    textOnPrimary: "#ffffff",
    border: "#e6e6e6",
    measureRing: "rgba(33, 150, 243, 0.35)",
    drawerBody: "#eef2f7",
    drawerHeaderBlue: "#2196f3",
    surfaceInput: "#ffffff",
    surfaceDeep: "#e8eff3",
    authJoinBackground: "#ffffff",
    authInputIconBg: "rgba(33, 150, 243, 0.12)",
    authInputIconFg: "#2196f3",
    dotInactive: "rgba(0, 0, 0, 0.2)",
    buttonSecondaryBg: "rgba(33, 150, 243, 0.1)",
    buttonSecondaryBgPressed: "rgba(33, 150, 243, 0.18)",
    pressHighlight: "rgba(0, 0, 0, 0.05)",
    tabBarBackground: "#ffffff",
  },
};

export function getPeacePlotNavigationTheme(scheme: PeacePlotScheme): Theme {
  const p = PeacePlotPalettes[scheme];
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: p.primary,
      background: p.background,
      card: p.cardNavSolid,
      text: p.text,
      border: p.border,
      notification: p.primary,
    },
  };
}
