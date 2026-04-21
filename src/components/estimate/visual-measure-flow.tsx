import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FaceLandmarkerWebView } from "@/components/estimate/face-landmarker-webview";
import type { StressEngineKind, VisualEstimationResult } from "@/lib/visual-estimation-types";
import { processPhotoForStress } from "@/lib/visual-stress-pipeline";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";
import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    root: { flex: 1 },
    body: { flex: 1, paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
    lead: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textBody,
    },
    demoBanner: {
      backgroundColor: "rgba(255, 193, 7, 0.18)",
      borderWidth: 1,
      borderColor: "rgba(255, 193, 7, 0.45)",
      borderRadius: 12,
      padding: 12,
    },
    demoBannerText: { fontSize: 13, lineHeight: 18, color: c.textBody },
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
    controls: { alignItems: "center", gap: 14, paddingTop: 8 },
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
    shutterOuter: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 4,
      borderColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    shutterInner: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: c.primary,
    },
    muted: { fontSize: 13, color: c.textMuted, textAlign: "center", lineHeight: 18 },
    error: { fontSize: 14, color: "#f48fb1", lineHeight: 20, textAlign: "center" },
    secondaryBtn: {
      alignSelf: "center",
      backgroundColor: c.buttonSecondaryBg,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    secondaryBtnText: { color: c.text, fontSize: 15, fontWeight: "600" },
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
    primaryBtn: {
      backgroundColor: c.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    primaryBtnText: { color: c.textOnPrimary, fontSize: 16, fontWeight: "700" },
  });
}

function bandLabel(b: VisualEstimationResult["stressBand"]): string {
  return b.charAt(0).toUpperCase() + b.slice(1);
}

function VisualMeasureFlowNative({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState(false);
  /** Web-only: native iOS/Android should not block on `isAvailableAsync` (it can throw or hang in dev builds). */
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(() =>
    Platform.OS === "web" ? null : true,
  );
  const [hasHandledUnavailableCamera, setHasHandledUnavailableCamera] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [lastResult, setLastResult] = useState<VisualEstimationResult | null>(null);
  const [lastEngine, setLastEngine] = useState<StressEngineKind | null>(null);
  /** Native: MediaPipe WASM runs inside WebView; wait for init before capture. */
  const [faceEngineReady, setFaceEngineReady] = useState(Platform.OS === "web");
  const [faceEngineError, setFaceEngineError] = useState<string | null>(null);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);


  useEffect(() => {
    if (Platform.OS !== "web") return;
    let active = true;
    void CameraView.isAvailableAsync()
      .then((ok) => {
        if (active) setCameraAvailable(ok);
      })
      .catch(() => {
        if (active) setCameraAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // expo-camera sometimes never fires onCameraReady while the preview is usable; allow capture after a short delay.
  useEffect(() => {
    if (!permission?.granted || cameraAvailable !== true) return;
    if (Platform.OS === "web") return;
    const delayMs = Platform.OS === "ios" ? 2800 : 4000;
    const t = setTimeout(() => {
      setCameraReady((ready) => ready || true);
    }, delayMs);
    return () => clearTimeout(t);
  }, [permission?.granted, cameraAvailable]);

  useEffect(() => {
    if (!permission?.granted || cameraReady || hasHandledUnavailableCamera) return;
    const t = setTimeout(() => {
      setHasHandledUnavailableCamera(true);
      Alert.alert(
        "Camera unavailable",
        "The front camera did not become ready in time. Try leaving this screen and opening Camera again, or restart the app.",
        [{ text: "OK", onPress: onBack }],
      );
    }, 45_000);
    return () => clearTimeout(t);
  }, [permission?.granted, cameraReady, hasHandledUnavailableCamera, onBack]);

  const onShutter = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || busy) return;
    if (Platform.OS !== "web" && !faceEngineReady) return;
    setError(null);
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: Platform.OS === "ios",
      });
      if (!photo?.uri) {
        setError("Could not capture photo. Please try again.");
        return;
      }
      const outcome = await processPhotoForStress(photo.uri, photo.width, photo.height);
      if (outcome.kind === "retry") {
        setError(outcome.message);
        setDemoNotice(false);
        setLastEngine(null);
        return;
      }
      setLastResult(outcome.result);
      setDemoNotice(outcome.faceDetectionDemo);
      setLastEngine(outcome.stressEngine);
      setModalOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }, [cameraReady, busy, faceEngineReady]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const continueToGating = useCallback(() => {
    if (!lastResult) return;
    setModalOpen(false);
    const q: Record<string, string> = {
      mode: "camera",
      stressBand: lastResult.stressBand,
      stressScore: String(lastResult.stressScore100),
      transcript: "",
      durationSec: "",
    };
    router.push({
      pathname: "/estimate/dataset-types",
      params: q,
    } as Href);
  }, [lastResult, router]);

  if (!permission) {
    return (
      <View style={[styles.body, styles.analyzingRow]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.muted}>Checking camera access…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.body}>
        <Text style={styles.lead}>
          PeacePlot needs camera access for a one-time face check-in. Images are analyzed on-device
          for this build where supported; see settings for details.
        </Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => void requestPermission()}
          accessibilityRole="button"
          accessibilityLabel="Allow camera access"
        >
          <Text style={styles.primaryBtnText}>Allow camera</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={openSettings} accessibilityRole="button">
          <Text style={styles.secondaryBtnText}>Open system settings</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={onBack} accessibilityRole="button">
          <Text style={styles.secondaryBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (cameraAvailable !== true) {
    return (
      <View style={[styles.body, styles.analyzingRow]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.muted}>Preparing front camera…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {Platform.OS !== "web" ? (
        <FaceLandmarkerWebView
          onEngineReady={() => {
            setFaceEngineError(null);
            setFaceEngineReady(true);
          }}
          onEngineError={(message) => {
            setFaceEngineError(message);
            setFaceEngineReady(false);
          }}
        />
      ) : null}
      <View style={styles.body}>
        {faceEngineError && Platform.OS !== "web" ? (
          <View style={[styles.demoBanner, { borderColor: "rgba(244, 67, 54, 0.45)" }]}>
            <Text style={styles.demoBannerText}>
              Face engine failed to load ({faceEngineError}). Check your network and try leaving this
              screen and opening it again.
            </Text>
          </View>
        ) : null}
        {!faceEngineReady && Platform.OS !== "web" && !faceEngineError ? (
          <View style={[styles.demoBanner, { backgroundColor: "rgba(33, 150, 243, 0.12)", borderColor: "rgba(33, 150, 243, 0.35)" }]}>
            <Text style={styles.demoBannerText}>
              Loading MediaPipe Face Landmarker in a secure web view (first open may take a few
              seconds)…
            </Text>
          </View>
        ) : null}
        {demoNotice ? (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>
              Face ML isn’t available in this environment (e.g. Expo Go without the face engine).
              Showing a demo stress score so you can test the flow — use a development build with
              network access for real face checks.
            </Text>
          </View>
        ) : Platform.OS === "web" ? (
          <View style={[styles.demoBanner, { backgroundColor: "rgba(33, 150, 243, 0.12)", borderColor: "rgba(33, 150, 243, 0.35)" }]}>
            <Text style={styles.demoBannerText}>
              Web: stress estimate uses MediaPipe Face Landmarker (WASM) in your browser, then maps
              blendshapes / geometry to a wellness score (not a clinical diagnosis).
            </Text>
          </View>
        ) : null}

        <Text style={styles.lead}>
          Center your face in the frame, then tap the button. We’ll confirm a face is visible, then
          estimate a stress signal for this moment.
        </Text>

        <View style={styles.previewWrap}>
          <CameraView
            ref={cameraRef}
            style={styles.preview}
            facing="front"
            mirror
            mode="picture"
            onCameraReady={() => setCameraReady(true)}
            onMountError={(ev) => {
              const msg = ev.message || "Could not open the front camera.";
              setError(msg);
              Alert.alert("Camera error", msg, [{ text: "OK", onPress: onBack }]);
            }}
          />
          <View style={styles.hintOverlay} pointerEvents="none">
            <Text style={styles.hintText}>Good light and a steady pose help.</Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.controlsCard}>
          <View style={styles.controls}>
            {busy ? (
              <View style={styles.analyzingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.muted}>Analyzing…</Text>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Take photo for stress check-in"
                onPress={() => void onShutter()}
                disabled={!cameraReady || (Platform.OS !== "web" && !faceEngineReady)}
                style={({ pressed }) => [
                  {
                    opacity:
                      pressed || !cameraReady || (Platform.OS !== "web" && !faceEngineReady)
                        ? 0.75
                        : 1,
                  },
                ]}
              >
                <View style={styles.shutterOuter}>
                  <View style={styles.shutterInner} />
                </View>
              </Pressable>
            )}
            <Text style={styles.muted}>
              {!cameraReady
                ? "Starting camera…"
                : Platform.OS !== "web" && !faceEngineReady
                  ? "Loading face engine…"
                  : "Tap to capture"}
            </Text>
          </View>

          <Pressable style={styles.secondaryBtn} onPress={onBack} accessibilityRole="button">
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Stress signal</Text>
            {lastResult ? (
              <>
                <Text style={styles.modalScore}>{lastResult.stressScore100}</Text>
                <Text style={styles.modalBand}>
                  {bandLabel(lastResult.stressBand)} · 0–100 index
                </Text>
                <Text style={styles.modalNote}>
                  Higher = more acute load in this snapshot. Wellness-only — not a diagnosis. Engine:{" "}
                  {lastEngine === "mediapipe"
                    ? "MediaPipe Face Landmarker (blendshapes + landmarks) + heuristic wellness mapping"
                    : lastEngine === "mlkit"
                      ? "Google ML face geometry + heuristic mapping"
                      : lastEngine === "demo"
                        ? "Demo (face engine unavailable)"
                        : "—"}
                  . Optional: fine-tuned classifier per assets/models when ready.
                </Text>
              </>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.primaryBtn}
                onPress={continueToGating}
                accessibilityRole="button"
                accessibilityLabel="Continue to dataset selection"
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={closeModal}
                accessibilityRole="button"
                accessibilityLabel="Dismiss and take another photo"
              >
                <Text style={styles.secondaryBtnText}>Take another photo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function VisualMeasureFlow({ onBack }: { onBack: () => void }) {
  return <VisualMeasureFlowNative onBack={onBack} />;
}
