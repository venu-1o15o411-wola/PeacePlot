import Ionicons from "@expo/vector-icons/Ionicons";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { mockVoiceEstimationFromDuration } from "@/lib/mock-voice-estimation";
import type { PeacePlotPalette } from "@/theme/peaceplot-theme";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

const MAX_RECORDING_SEC = 120;

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    body: { padding: 20, gap: 16, paddingBottom: 40 },
    lead: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textBody,
    },
    emphasis: {
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryLight2,
      fontWeight: "600",
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      gap: 12,
    },
    timer: {
      fontSize: 36,
      fontWeight: "700",
      color: c.text,
      fontVariant: ["tabular-nums"],
      textAlign: "center",
    },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
    primaryBtn: {
      backgroundColor: c.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: "center",
    },
    primaryBtnText: { color: c.textOnPrimary, fontSize: 16, fontWeight: "700" },
    secondaryBtn: {
      backgroundColor: c.buttonSecondaryBg,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
    },
    secondaryBtnText: { color: c.text, fontSize: 15, fontWeight: "600" },
    dangerBtn: {
      backgroundColor: "rgba(244, 67, 54, 0.2)",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
    },
    dangerBtnText: { color: "#f48fb1", fontSize: 15, fontWeight: "600" },
    muted: { fontSize: 13, color: c.textMuted, lineHeight: 18 },
    error: { fontSize: 14, color: "#f48fb1", lineHeight: 20 },
  });
}

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${r.toString().padStart(2, "0")}` : `0:${r.toString().padStart(2, "0")}`;
}

function AudioMeasureWebStub({
  onBack,
  styles,
}: {
  onBack: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.lead}>
        Voice check-in for stress measurement uses the microphone. On web, use the PeacePlot
        iOS or Android build for recording (see product plan: measurement audio is not library
        playback).
      </Text>
      <Pressable style={styles.secondaryBtn} onPress={onBack} accessibilityRole="button">
        <Text style={styles.secondaryBtnText}>Go back</Text>
      </Pressable>
    </ScrollView>
  );
}

function PlaybackPreview({
  uri,
  colors,
  styles,
}: {
  uri: string;
  colors: PeacePlotPalette;
  styles: ReturnType<typeof createStyles>;
}) {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);

  const toggle = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={toggle}
        style={styles.secondaryBtn}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? "Pause playback" : "Play recording"}
      >
        <Ionicons
          name={status.playing ? "pause" : "play"}
          size={22}
          color={colors.text}
        />
      </Pressable>
      <Text style={styles.muted}>
        Preview ({Math.round(status.duration || 0)}s) — for your ears only; not music streaming.
      </Text>
    </View>
  );
}

function AudioMeasureFlowNative({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recordState = useAudioRecorderState(recorder, 300);
  const [perm, setPerm] = useState<"unknown" | "granted" | "denied">("unknown");
  const [phase, setPhase] = useState<"idle" | "recording" | "review">("idle");
  const [error, setError] = useState<string | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);

  const refreshPerm = useCallback(async () => {
    try {
      const r = await getRecordingPermissionsAsync();
      setPerm(r.granted ? "granted" : "denied");
      return r.granted;
    } catch {
      setPerm("denied");
      return false;
    }
  }, []);

  useEffect(() => {
    void refreshPerm();
  }, [refreshPerm]);

  useEffect(() => {
    setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: "duckOthers",
    }).catch(() => {});
  }, []);

  const stopRecording = useCallback(async () => {
    setError(null);
    try {
      const statusBefore = recorder.getStatus();
      await recorder.stop();
      const uri = recorder.uri ?? statusBefore.url;
      const secs = statusBefore.durationMillis / 1000;
      setDurationSec(secs);
      if (uri) setRecordingUri(uri);
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finish recording.");
      setPhase("idle");
    }
  }, [recorder]);

  useEffect(() => {
    if (phase !== "recording") return;
    if (recordState.durationMillis >= MAX_RECORDING_SEC * 1000) {
      void stopRecording();
    }
  }, [phase, recordState.durationMillis, stopRecording]);

  const startRecording = async () => {
    setError(null);
    setRecordingUri(null);
    const ok =
      perm === "granted" ? true : (await requestRecordingPermissionsAsync()).granted;
    if (!ok) {
      setPerm("denied");
      Alert.alert(
        "Microphone access",
        "PeacePlot needs the microphone for short voice check-ins only—not for music or background listening.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open settings", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    setPerm("granted");
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase("recording");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start recording.");
    }
  };

  const reRecord = async () => {
    setRecordingUri(null);
    setPhase("idle");
    setError(null);
    try {
      await recorder.stop();
    } catch {
      /* noop */
    }
  };

  const continueToGating = () => {
    if (durationSec < 2) {
      setError("Record a little longer so we can estimate stress from your voice.");
      return;
    }
    setError(null);
    const est = mockVoiceEstimationFromDuration(durationSec);
    const q: Record<string, string> = {
      mode: "audio",
      stressBand: est.stressBand,
      stressScore: String(est.stressScore100),
      transcript: est.transcriptPreview.slice(0, 500),
      durationSec: String(Math.round(durationSec)),
    };
    router.push({
      pathname: "/estimate/dataset-types",
      params: q,
    } as Href);
  };

  useEffect(() => {
    return () => {
      recorder.stop().catch(() => {});
    };
  }, [recorder]);

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.lead}>
        Speak freely for up to {MAX_RECORDING_SEC} seconds. This is{" "}
        <Text style={styles.emphasis}>voice capture for stress measurement only</Text>—not music,
        podcasts, or sleep audio (see Discover for playback content).
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {phase === "idle" && (
        <View style={styles.card}>
          <Text style={styles.muted}>
            We will ask for microphone access when you start. You can change this anytime in system
            settings.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={startRecording}
            accessibilityRole="button"
            accessibilityLabel="Start voice check-in"
          >
            <Text style={styles.primaryBtnText}>Start voice check-in</Text>
          </Pressable>
        </View>
      )}

      {phase === "recording" && (
        <View style={styles.card}>
          <Text style={styles.timer}>{formatMs(recordState.durationMillis)}</Text>
          <Text style={styles.muted} accessibilityLiveRegion="polite">
            Recording… tap stop when you are done describing how stress shows up for you lately.
          </Text>
          <Pressable
            style={styles.dangerBtn}
            onPress={() => void stopRecording()}
            accessibilityRole="button"
            accessibilityLabel="Stop recording"
          >
            <Text style={styles.dangerBtnText}>Stop</Text>
          </Pressable>
        </View>
      )}

      {phase === "review" && (
        <View style={styles.card}>
          <Text style={styles.lead}>
            Saved {Math.round(durationSec)}s sample.
            {recordingUri
              ? " Listen to confirm it sounds right, then continue."
              : " Preview unavailable on this device; you can still continue or re-record."}
          </Text>
          {recordingUri ? (
            <PlaybackPreview uri={recordingUri} colors={colors} styles={styles} />
          ) : null}
          <View style={{ gap: 10 }}>
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
              onPress={() => void reRecord()}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>Re-record</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable style={styles.secondaryBtn} onPress={onBack} accessibilityRole="button">
        <Text style={styles.secondaryBtnText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

export function AudioMeasureFlow({ onBack }: { onBack: () => void }) {
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (Platform.OS === "web") {
    return <AudioMeasureWebStub onBack={onBack} styles={styles} />;
  }

  return <AudioMeasureFlowNative onBack={onBack} />;
}
