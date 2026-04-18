import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraDevices,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import { useResizePlugin } from "vision-camera-resize-plugin";

import {
  bandLabel,
  createStyles,
  toErrorCopy,
} from "@/components/estimate/finger-measure-flow-common";
import {
  isFingerDetected,
  runFingerPPGEstimation,
  type FingerFrameSample,
  type FingerStressResult,
} from "@/lib/finger-engine.native";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

const COLLECTION_MS = 15_000;

function FingerMeasureFlowNative({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const devices = useCameraDevices();
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  const { resize } = useResizePlugin();

  const samplesRef = useRef<FingerFrameSample[]>([]);
  const collectingSinceRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<"idle" | "collecting" | "processing">("idle");
  const [progress, setProgress] = useState(0);
  const [lastFingerDetected, setLastFingerDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<FingerStressResult, { ok: true }> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasHandledUnavailableCamera, setHasHandledUnavailableCamera] = useState(false);

  useEffect(() => {
    if (!hasPermission || device || hasHandledUnavailableCamera) return;
    // `useCameraDevice` can stay undefined briefly while native enumerates cameras; 4.5s was too aggressive on cold start.
    const t = setTimeout(() => {
      if (device) return;
      setHasHandledUnavailableCamera(true);
      Alert.alert(
        "No camera device found",
        devices.length === 0
          ? "The camera list isn’t ready or access may be blocked. Try again in a moment, or check Settings → Privacy → Camera for PeacePlot."
          : "No back camera was found for this check-in. If you’re on a real iPhone, try closing other apps that use the camera, then try again.",
        [{ text: "OK", onPress: onBack }],
      );
    }, 25_000);
    return () => clearTimeout(t);
  }, [device, devices.length, hasHandledUnavailableCamera, hasPermission, onBack]);

  const stopAndAnalyze = useCallback(() => {
    if (phase !== "collecting") return;
    setPhase("processing");
    const startedAt = collectingSinceRef.current ?? Date.now();
    const duration = Math.max(0, Date.now() - startedAt);
    const outcome = runFingerPPGEstimation(samplesRef.current, duration);
    if (!outcome.ok) {
      setError(toErrorCopy(outcome.error));
      setResult(null);
      setPhase("idle");
      setProgress(0);
      return;
    }
    setResult(outcome);
    setError(null);
    setPhase("idle");
    setProgress(0);
    setModalOpen(true);
  }, [phase]);

  const onFrameSample = useCallback(
    (sample: FingerFrameSample) => {
      const fingerDetected = isFingerDetected(sample);
      setLastFingerDetected(fingerDetected);
      if (phase !== "collecting") return;
      const sampleWithTime: FingerFrameSample = { ...sample, timestampMs: Date.now() };
      samplesRef.current.push(sampleWithTime);

      const started = collectingSinceRef.current;
      if (!started) return;
      const elapsed = sampleWithTime.timestampMs - started;
      const pct = Math.max(0, Math.min(1, elapsed / COLLECTION_MS));
      setProgress(pct);
      if (elapsed >= COLLECTION_MS) {
        stopAndAnalyze();
      }
    },
    [phase, stopAndAnalyze],
  );

  const onFrameSampleWorklet = useMemo(
    () => Worklets.createRunOnJS(onFrameSample),
    [onFrameSample],
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      const rgb = resize(frame, {
        scale: { width: 20, height: 20 },
        pixelFormat: "rgb",
        dataType: "uint8",
      }) as Uint8Array;

      if (!rgb || rgb.length < 3) return;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumL = 0;
      let sumL2 = 0;
      const pxCount = Math.floor(rgb.length / 3);
      for (let i = 0; i < rgb.length; i += 3) {
        const r = rgb[i] ?? 0;
        const g = rgb[i + 1] ?? 0;
        const b = rgb[i + 2] ?? 0;
        sumR += r;
        sumG += g;
        sumB += b;
        const l = 0.299 * r + 0.587 * g + 0.114 * b;
        sumL += l;
        sumL2 += l * l;
      }

      const meanR = sumR / pxCount;
      const meanG = sumG / pxCount;
      const meanB = sumB / pxCount;
      const meanL = sumL / pxCount;
      const variance = Math.max(0, sumL2 / pxCount - meanL * meanL);
      onFrameSampleWorklet({
        timestampMs: 0,
        red: meanR,
        green: meanG,
        blue: meanB,
        luminanceVariance: variance,
      });
    },
    [resize, onFrameSampleWorklet],
  );

  const startCollection = useCallback(() => {
    if (!lastFingerDetected) {
      setError("Cover the camera lens and flash fully with your finger before starting.");
      return;
    }
    samplesRef.current = [];
    collectingSinceRef.current = Date.now();
    setProgress(0);
    setError(null);
    setPhase("collecting");
  }, [lastFingerDetected]);

  const continueToGating = useCallback(() => {
    if (!result) return;
    setModalOpen(false);
    const q: Record<string, string> = {
      mode: "fingerprint",
      stressBand: result.stressBand,
      stressScore: String(result.stressScore),
      transcript: "",
      durationSec: "15",
    };
    router.push({
      pathname: "/estimate/dataset-types",
      params: q,
    } as Href);
  }, [result, router]);

  if (!hasPermission) {
    return (
      <View style={styles.body}>
        <Text style={styles.lead}>
          PeacePlot needs camera access for finger pulse check-ins using the back camera and flash.
        </Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => void requestPermission()}
          accessibilityRole="button"
          accessibilityLabel="Allow camera access"
        >
          <Text style={styles.primaryBtnText}>Allow camera</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => void Linking.openSettings()}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryBtnText}>Open system settings</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.body, styles.analyzingRow]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.muted}>Preparing back camera…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.lead}>
          Place your fingertip over the back camera and flash. Hold steady for 15 seconds while we
          read pulse-wave changes to estimate stress.
        </Text>

        <View style={styles.statusChip}>
          <Text style={styles.statusChipText}>
            {lastFingerDetected ? "Finger seal detected" : "Waiting for full finger cover"}
          </Text>
        </View>

        <View style={styles.previewWrap}>
          <Camera
            style={styles.preview}
            device={device}
            isActive
            torch="on"
            frameProcessor={frameProcessor}
            pixelFormat="rgb"
          />
          <View style={styles.hintOverlay} pointerEvents="none">
            <Text style={styles.hintText}>Cover lens + flash completely and avoid movement.</Text>
          </View>
          {phase === "collecting" ? (
            <View style={styles.progressWrap} pointerEvents="none">
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>
                Collecting pulse signal… {Math.max(0, 15 - Math.floor(progress * 15))}s
              </Text>
            </View>
          ) : null}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.controlsCard}>
          {phase === "processing" ? (
            <View style={styles.analyzingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.muted}>Processing HRV…</Text>
            </View>
          ) : (
            <>
              <Pressable
                style={styles.primaryBtn}
                onPress={startCollection}
                disabled={phase === "collecting"}
                accessibilityRole="button"
                accessibilityLabel="Start finger pulse check-in"
              >
                <Text style={styles.primaryBtnText}>
                  {phase === "collecting" ? "Collecting…" : "Start 15s check-in"}
                </Text>
              </Pressable>
              {phase === "collecting" ? (
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={stopAndAnalyze}
                  accessibilityRole="button"
                  accessibilityLabel="Stop and analyze signal"
                >
                  <Text style={styles.secondaryBtnText}>Stop now</Text>
                </Pressable>
              ) : null}
            </>
          )}
          <Pressable style={styles.secondaryBtn} onPress={onBack} accessibilityRole="button">
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Finger stress signal</Text>
            {result ? (
              <>
                <Text style={styles.modalScore}>{result.stressScore}</Text>
                <Text style={styles.modalBand}>{bandLabel(result.stressBand)}</Text>
                <Text style={styles.modalNote}>
                  Engine: finger PPG. BPM: {result.bpm}. RMSSD: {result.rmssd} ms. Confidence:{" "}
                  {result.confidence}%.
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
                onPress={() => setModalOpen(false)}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryBtnText}>Take another reading</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function FingerMeasureFlow({ onBack }: { onBack: () => void }) {
  return <FingerMeasureFlowNative onBack={onBack} />;
}

export default FingerMeasureFlow;
