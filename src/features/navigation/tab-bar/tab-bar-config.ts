import Ionicons from "@expo/vector-icons/Ionicons";

export const TAB_ROUTES: Record<
  string,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
  }
> = {
  index: { label: "Home", icon: "home-outline", activeIcon: "home" },
  discover: { label: "Discover", icon: "compass-outline", activeIcon: "compass" },
  measure: { label: "Measure", icon: "pulse-outline", activeIcon: "pulse" },
  "virtual-doctor": { label: "Doctor", icon: "medkit-outline", activeIcon: "medkit" },
  profile: { label: "Profile", icon: "person-outline", activeIcon: "person" },
};
