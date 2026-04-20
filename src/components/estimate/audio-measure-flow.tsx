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
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as SpeechTranscriber from "expo-speech-transcriber";
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G } from "react-native-svg";

import { getGeminiWellnessAnalysis, isGeminiConfigured } from "@/lib/gemini-voice";
import { mockVoiceEstimationFromDuration } from "@/lib/mock-voice-estimation";
import { setVoiceEstimateSession } from "@/lib/voice-estimate-session";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";
import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

const MAX_RECORDING_SEC = 120;
const WAVE_BARS = 24;

/** iOS: `expo-speech-transcriber` file API — prefers SFSpeechRecognizer, falls back to SpeechAnalyzer when available. */
async function transcribeIosRecording(uri: string): Promise<string> {
  const primary = await SpeechTranscriber.transcribeAudioWithSFRecognizer(uri);
  if (primary.trim()) return primary.trim();
  if (SpeechTranscriber.isAnalyzerAvailable()) {
    const second = await SpeechTranscriber.transcribeAudioWithAnalyzer(uri);
    if (second.trim()) return second.trim();
  }
  throw new Error("Transcription returned empty text.");
}
const PROGRESS_RING_SIZE = 200;
const PROGRESS_STROKE = 6;

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    body: { padding: 20, gap: 20, paddingBottom: 40 },
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
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
      gap: 16,
    },
    timer: {
      fontSize: 32,
      fontWeight: "700",
      color: c.text,
      fontVariant: ["tabular-nums"],
      textAlign: "center",
    },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
    previewBlock: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 4,
    },
    playBtn: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: c.buttonSecondaryBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
      flexShrink: 0,
    },
    previewCopy: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 20, color: c.textMuted },
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
    muted: { fontSize: 13, color: c.textMuted, lineHeight: 18 },
    error: { fontSize: 14, color: "#f48fb1", lineHeight: 20 },
    holdZone: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
    },
    holdLabel: { fontSize: 17, fontWeight: "700", color: c.text, textAlign: "center" },
    waveRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "center",
      height: 56,
      gap: 3,
      marginBottom: 8,
    },
    waveBar: {
      width: 4,
      borderRadius: 2,
      minHeight: 4,
    },
    ring: {
      position: "absolute",
      borderWidth: 2.5,
      borderRadius: 999,
    },
    micButton: {
      width: 112,
      height: 112,
      borderRadius: 56,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${r.toString().padStart(2, "0")}` : `0:${r.toString().padStart(2, "0")}`;
}

function RecordingProgressRing({
  progress,
  color,
  trackColor,
}: {
  /** 0–1 of max recording time */
  progress: number;
  color: string;
  trackColor: string;
}) {
  const size = PROGRESS_RING_SIZE;
  const r = (size - PROGRESS_STROKE) / 2 - 1;
  const circumference = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  const dashOffset = circumference * (1 - p);
  const c = size / 2;
  return (
    <View
      style={{ width: size, height: size, position: "absolute", zIndex: 1 }}
      pointerEvents="none"
    >
      <Svg width={size} height={size}>
        <G transform={`rotate(-90 ${c} ${c})`}>
          <Circle
            cx={c}
            cy={c}
            r={r}
            stroke={trackColor}
            strokeWidth={PROGRESS_STROKE}
            fill="none"
            opacity={0.4}
          />
          <Circle
            cx={c}
            cy={c}
            r={r}
            stroke={color}
            strokeWidth={PROGRESS_STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </G>
      </Svg>
    </View>
  );
}

function WaveformBar({
  index,
  total,
  phase,
  color,
  barMuted,
}: {
  index: number;
  total: number;
  phase: SharedValue<number>;
  color: string;
  barMuted: string;
}) {
  const style = useAnimatedStyle(() => {
    const base = (index / total) * Math.PI * 2;
    const t = phase.value * Math.PI * 2 * 2.2;
    const wobble = 0.5 + 0.5 * Math.sin(t + base);
    const h = 4 + 32 * wobble;
    return {
      height: h,
      backgroundColor: wobble > 0.5 ? color : barMuted,
      opacity: 0.5 + 0.45 * wobble,
    };
  });
  return <Animated.View style={[{ width: 3, borderRadius: 2, marginHorizontal: 1 }, style]} />;
}

function AudioWaveform({
  active,
  color,
  barMuted,
}: {
  active: boolean;
  color: string;
  barMuted: string;
}) {
  const phase = useSharedValue(0);

  useEffect(() => {
    if (active) {
      phase.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(phase);
      phase.value = 0;
    }
  }, [active, phase]);

  if (!active) {
    return null;
  }
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]} pointerEvents="none">
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 8,
        }}
      >
        {Array.from({ length: WAVE_BARS }, (_, i) => (
          <WaveformBar
            key={i}
            index={i}
            total={WAVE_BARS}
            phase={phase}
            color={color}
            barMuted={barMuted}
          />
        ))}
      </View>
    </View>
  );
}

function RecordingRingSolo({
  scale: sv,
  opacity: ov,
  borderColor,
}: {
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  borderColor: string;
}) {
  const style = useAnimatedStyle(() => {
    const k = 1 + sv.value * 0.55;
    return {
      position: "absolute" as const,
      width: 200 * k,
      height: 200 * k,
      borderRadius: 1000,
      borderWidth: 2.5,
      borderColor,
      backgroundColor: "transparent" as const,
      opacity: ov.value * 0.85,
    };
  });
  return <Animated.View style={style} pointerEvents="none" />;
}

function RecordingRings({ active, borderColor }: { active: boolean; borderColor: string }) {
  const s1 = useSharedValue(0);
  const s2 = useSharedValue(0);
  const s3 = useSharedValue(0);
  const op1 = useSharedValue(0);
  const op2 = useSharedValue(0);
  const op3 = useSharedValue(0);

  useEffect(() => {
    if (active) {
      const ringAnim = (offset: number) =>
        withRepeat(
          withSequence(
            withTiming(1, { duration: 900 + offset, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 0 }),
          ),
          -1,
          false,
        );
      s1.value = ringAnim(0);
      s2.value = ringAnim(200);
      s3.value = ringAnim(400);
      op1.value = withRepeat(
        withSequence(
          withTiming(0.55, { duration: 450, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 450 }),
        ),
        -1,
        false,
      );
      op2.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 150 }),
          withTiming(0.45, { duration: 400, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 350 }),
        ),
        -1,
        false,
      );
      op3.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 300 }),
          withTiming(0.35, { duration: 350, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 250 }),
        ),
        -1,
        false,
      );
    } else {
      for (const v of [s1, s2, s3, op1, op2, op3]) {
        cancelAnimation(v);
        v.value = 0;
      }
    }
  }, [active, s1, s2, s3, op1, op2, op3]);

  if (!active) {
    return null;
  }
  return (
    <View
      style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", zIndex: 0 }]}
      pointerEvents="none"
    >
      <RecordingRingSolo scale={s1} opacity={op1} borderColor={borderColor} />
      <RecordingRingSolo scale={s2} opacity={op2} borderColor={borderColor} />
      <RecordingRingSolo scale={s3} opacity={op3} borderColor={borderColor} />
    </View>
  );
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
        Professional voice check-in uses the microphone. On web, use the PeacePlot iOS or Android
        app for press-and-hold recording (see plan: measurement audio is not library playback).
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
    <View style={styles.previewBlock} accessibilityLabel="Preview recording playback">
      <Pressable
        onPress={toggle}
        style={styles.playBtn}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? "Pause playback" : "Play recording"}
      >
        <Ionicons
          name={status.playing ? "pause" : "play"}
          size={24}
          color={colors.text}
        />
      </Pressable>
      <Text style={styles.previewCopy}>
        Preview ({Math.round(status.duration || 0)}s). For your ears only — this is not music
        streaming.
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
  const [isSubmittingNext, setIsSubmittingNext] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const stoppingRef = useRef(false);
  const armingRef = useRef(false);
  const abortArmingRef = useRef(false);
  const micScale = useSharedValue(1);

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

  const safeRecorderReset = useCallback(async () => {
    try {
      await recorder.stop();
    } catch {
      /* only prepared / idle */
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    if (stoppingRef.current) return;
    if (phaseRef.current !== "recording") return;
    stoppingRef.current = true;
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
    } finally {
      stoppingRef.current = false;
    }
  }, [recorder]);

  useEffect(() => {
    if (phase !== "recording") return;
    if (recordState.durationMillis >= MAX_RECORDING_SEC * 1000) {
      void stopRecording();
    }
  }, [phase, recordState.durationMillis, stopRecording]);

  const onPressIn = useCallback(async () => {
    if (phaseRef.current !== "idle" || armingRef.current) return;
    armingRef.current = true;
    abortArmingRef.current = false;
    setError(null);
    setRecordingUri(null);
    micScale.value = withTiming(0.94, { duration: 120, easing: Easing.out(Easing.cubic) });

    const fail = async (message?: string) => {
      armingRef.current = false;
      if (message) setError(message);
      micScale.value = withTiming(1, { duration: 200 });
      await safeRecorderReset();
    };

    try {
      const ok = perm === "granted" ? true : (await requestRecordingPermissionsAsync()).granted;
      if (abortArmingRef.current) {
        await fail();
        return;
      }
      if (!ok) {
        setPerm("denied");
        await fail();
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
      await recorder.prepareToRecordAsync();
      if (abortArmingRef.current) {
        await fail();
        return;
      }
      recorder.record();
      armingRef.current = false;
      setPhase("recording");
      micScale.value = withSequence(
        withTiming(1.06, { duration: 120, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 200, easing: Easing.inOut(Easing.cubic) }),
      );
    } catch (e) {
      await fail(e instanceof Error ? e.message : "Could not start recording.");
    }
  }, [perm, recorder, safeRecorderReset, micScale]);

  const onPressOut = useCallback(() => {
    abortArmingRef.current = true;
    if (armingRef.current) {
      armingRef.current = false;
      void safeRecorderReset();
      micScale.value = withTiming(1, { duration: 200 });
      return;
    }
    if (phaseRef.current === "recording") {
      void stopRecording();
    }
  }, [safeRecorderReset, stopRecording, micScale]);

  const reRecord = useCallback(async () => {
    setRecordingUri(null);
    setPhase("idle");
    setError(null);
    armingRef.current = false;
    abortArmingRef.current = false;
    await safeRecorderReset();
  }, [safeRecorderReset]);

  const continueToGating = useCallback(async () => {
    if (durationSec < 2) {
      setError("Record a little longer so we can estimate stress from your voice.");
      return;
    }
    setError(null);
    setIsSubmittingNext(true);
    try {
      const est = mockVoiceEstimationFromDuration(durationSec);
      let transcript = est.transcriptPreview;
      let transcribeNote = "";

      try {
        if (recordingUri) {
          const sp = await SpeechTranscriber.requestPermissions();
          if (sp !== "authorized") {
            transcribeNote = "Speech recognition permission denied—using placeholder text.";
          } else if (Platform.OS === "ios") {
            transcript = await transcribeIosRecording(recordingUri);
          } else {
            transcribeNote =
              "File transcription is currently implemented for iOS in this flow; using placeholder text on this device.";
          }
        } else {
          transcribeNote = "No recording URI available; using placeholder text.";
        }
      } catch (e) {
        transcribeNote = e instanceof Error ? e.message : "Transcription failed.";
        transcript = est.transcriptPreview;
      }

      let guidance = "";
      if (isGeminiConfigured()) {
        try {
          guidance = await getGeminiWellnessAnalysis({
            transcript,
            stressBand: est.stressBand,
            stressScore100: est.stressScore100,
          });
          if (transcribeNote) {
            guidance = `${transcribeNote}\n\n${guidance}`;
          }
        } catch (e) {
          guidance = transcribeNote
            ? `${transcribeNote}\n\n${e instanceof Error ? e.message : "Gemini unavailable."}`
            : e instanceof Error
              ? e.message
              : "Gemini unavailable.";
        }
      } else if (transcribeNote) {
        guidance = transcribeNote;
      }

      setVoiceEstimateSession({ transcript, guidance });

      router.push({
        pathname: "/estimate/dataset-types",
        params: {
          mode: "audio",
          stressBand: est.stressBand,
          stressScore: String(est.stressScore100),
          transcript: transcript.slice(0, 500),
          durationSec: String(Math.round(durationSec)),
        },
      } as Href);
    } finally {
      setIsSubmittingNext(false);
    }
  }, [durationSec, recordingUri, router]);

  const micAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  useEffect(() => {
    return () => {
      recorder.stop().catch(() => {});
    };
  }, [recorder]);

  const isRecording = phase === "recording";
  const showRecorder = phase === "idle" || phase === "recording";
  const recordProgress = Math.min(1, recordState.durationMillis / (MAX_RECORDING_SEC * 1000));

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.lead}>
        <Text style={styles.emphasis}>Press and hold</Text> the professional audio control to record.{" "}
        <Text style={styles.emphasis}>Release to stop</Text>—up to {MAX_RECORDING_SEC} seconds. Voice is
        for <Text style={styles.emphasis}>stress check-in only</Text>, not music or background
        listening.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {showRecorder ? (
        <View
          style={styles.holdZone}
          accessibilityLabel="Voice check-in. Hold to record, release to stop."
        >
          <View
            style={{
              minHeight: 220,
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 240,
                height: 240,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AudioWaveform
                active={isRecording}
                color={colors.primaryLight2}
                barMuted={colors.border}
              />
              <RecordingRings active={isRecording} borderColor={colors.primary} />
              {isRecording ? (
                <RecordingProgressRing
                  progress={recordProgress}
                  color={colors.primaryLight2}
                  trackColor={colors.border}
                />
              ) : null}
              <Pressable
                onPressIn={() => void onPressIn()}
                onPressOut={onPressOut}
                accessibilityRole="button"
                accessibilityLabel="Hold to record professional voice sample. Release to stop."
                style={({ pressed }) => [
                  {
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 3,
                    width: 168,
                    height: 168,
                    borderRadius: 84,
                  },
                  pressed && !isRecording ? { opacity: 0.92 } : null,
                ]}
                hitSlop={14}
              >
                <Animated.View
                  style={[
                    styles.micButton,
                    {
                      backgroundColor: isRecording ? colors.primary : colors.card,
                      borderWidth: 2,
                      borderColor: isRecording ? colors.primaryLight2 : colors.border,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: isRecording ? 0.5 : 0.22,
                      shadowRadius: 18,
                      elevation: isRecording ? 12 : 4,
                    },
                    micAnimStyle,
                  ]}
                >
                  <Ionicons
                    name={isRecording ? "stop-circle" : "mic"}
                    size={48}
                    color={isRecording ? colors.textOnPrimary : colors.primaryLight2}
                  />
                </Animated.View>
              </Pressable>
            </View>
          </View>
          {isRecording ? (
            <Text style={styles.timer} accessibilityLiveRegion="polite">
              {formatMs(recordState.durationMillis)}
            </Text>
          ) : null}
          <Text style={styles.holdLabel}>Professional audio</Text>
          <Text style={styles.muted} accessibilityLiveRegion="polite">
            {isRecording
              ? "Release to finish and review your recording."
              : "Touch and hold the button to record."}
          </Text>
        </View>
      ) : null}

      {phase === "review" && (
        <View style={styles.card}>
          <Text style={styles.lead}>
            Captured {Math.round(durationSec)}s.
            {recordingUri
              ? " Play back to confirm, or record again."
              : " Preview unavailable; you can record again or continue."}
          </Text>
          {recordingUri ? (
            <PlaybackPreview uri={recordingUri} colors={colors} styles={styles} />
          ) : null}
          {!isGeminiConfigured() ? (
            <Text style={styles.muted}>
              Add EXPO_PUBLIC_GEMINI_API_KEY for AI reflection on your words (optional).
            </Text>
          ) : null}
          <View style={{ gap: 10, marginTop: 4 }}>
            <Pressable
              style={[styles.primaryBtn, isSubmittingNext && { opacity: 0.75 }]}
              onPress={() => void continueToGating()}
              disabled={isSubmittingNext}
              accessibilityRole="button"
              accessibilityLabel="Next step, dataset types"
            >
              {isSubmittingNext ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={styles.primaryBtnText}>Next step</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => void reRecord()}
              accessibilityRole="button"
              accessibilityLabel="Record again"
            >
              <Text style={styles.secondaryBtnText}>Record again</Text>
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
