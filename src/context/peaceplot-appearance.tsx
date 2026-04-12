import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  PeacePlotPalettes,
  type PeacePlotPalette,
  type PeacePlotScheme,
} from "@/constants/peaceplot-theme";

const STORAGE_KEY = "peaceplot-appearance";

type Value = {
  scheme: PeacePlotScheme;
  setScheme: (s: PeacePlotScheme) => void;
};

const Ctx = createContext<Value | null>(null);

export function PeacePlotAppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scheme, setSchemeState] = useState<PeacePlotScheme>("dark");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (raw === "light" || raw === "dark")) {
          setSchemeState(raw);
        }
      } catch {
        /* keep default dark */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setScheme = useCallback((s: PeacePlotScheme) => {
    setSchemeState(s);
    AsyncStorage.setItem(STORAGE_KEY, s).catch(() => {});
  }, []);

  const value = useMemo(() => ({ scheme, setScheme }), [scheme, setScheme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePeacePlotAppearance(): Value {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error(
      "usePeacePlotAppearance must be used within PeacePlotAppearanceProvider",
    );
  }
  return v;
}

export function usePeacePlotColors(): PeacePlotPalette {
  const { scheme } = usePeacePlotAppearance();
  return PeacePlotPalettes[scheme];
}
