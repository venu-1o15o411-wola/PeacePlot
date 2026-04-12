/**
 * PeacePlot UI tokens — aligned with plan §2.2 (dark + blue, design/ SCSS reference).
 */
import type { Theme } from '@react-navigation/native';
import { DarkTheme } from '@react-navigation/native';

export const PeacePlotColors = {
  /** `.theme-dark` surface */
  background: '#2c3f6d',
  /** Slightly lifted surfaces / cards */
  card: '#344a7a',
  /** Header glass */
  headerGlass: 'rgba(44, 63, 109, 0.92)',
  /** Primary blue — color-blue preset */
  primary: '#2196f3',
  primaryHover: '#0c7cd5',
  primaryDark: '#064475',
  primaryLight2: '#8ecdff',
  /** Text */
  text: '#ffffff',
  textBody: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  border: 'rgba(255, 255, 255, 0.2)',
  /** Measure tab emphasis ring */
  measureRing: 'rgba(33, 150, 243, 0.45)',
  /**
   * Left drawer body (Soziety-style sidebar) — deep navy; reference ~#243460.
   */
  drawerBody: '#243460',
  /** Drawer user header strip (bright blue band) */
  drawerHeaderBlue: '#2196f3',
} as const;

export const PeacePlotNavigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: PeacePlotColors.primary,
    background: PeacePlotColors.background,
    card: PeacePlotColors.card,
    text: PeacePlotColors.text,
    border: PeacePlotColors.border,
    notification: PeacePlotColors.primary,
  },
};
