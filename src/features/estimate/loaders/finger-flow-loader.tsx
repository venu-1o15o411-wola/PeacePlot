import Constants from "expo-constants";
import { type ComponentType, lazy } from "react";
import { Platform } from "react-native";

type FingerFlowProps = { onBack: () => void };

export const FingerMeasureFlow = lazy(async () => {
  const inExpoGo = Constants.appOwnership === "expo";
  const useStub = Platform.OS === "web" || inExpoGo;
  const module = useStub
    ? await import("@/components/estimate/finger-measure-flow.web")
    : await import("@/components/estimate/finger-measure-flow.native");
  const Comp = (module.FingerMeasureFlow ??
    (module as { default: ComponentType<FingerFlowProps> }).default) as
    | ComponentType<FingerFlowProps>
    | undefined;
  if (!Comp) throw new Error("FingerMeasureFlow failed to load.");
  return { default: Comp };
});
