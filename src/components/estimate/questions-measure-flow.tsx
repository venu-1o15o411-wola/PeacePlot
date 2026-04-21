import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { invokeCheckinChat } from "@/lib/checkin-chat";
import { useAuth } from "@/providers/auth-session";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";
import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

/** Swap for an animated GIF in `assets/images/doctors/` when available — expo-image plays GIFs automatically. */
const DOCTOR_AVATAR = require("@/assets/images/doctors/doctor-1.jpg");

/** Multiline composer: 1 line default, up to 3 lines, then scroll inside the field. */
const INPUT_FONT_SIZE = 18;
const INPUT_LINE_HEIGHT = 26;
const INPUT_MIN_ROWS = 1;
const INPUT_MAX_ROWS = 3;
const INPUT_PAD_V = 11;
const INPUT_MIN_OUTER_HEIGHT =
  INPUT_LINE_HEIGHT * INPUT_MIN_ROWS + INPUT_PAD_V * 2;
const INPUT_MAX_OUTER_HEIGHT =
  INPUT_LINE_HEIGHT * INPUT_MAX_ROWS + INPUT_PAD_V * 2;

function outerHeightForRows(rows: number): number {
  const r = Math.max(
    INPUT_MIN_ROWS,
    Math.min(INPUT_MAX_ROWS, Math.round(rows)),
  );
  return r * INPUT_LINE_HEIGHT + INPUT_PAD_V * 2;
}

function contentHeightToRowCount(contentHeight: number): number {
  if (!Number.isFinite(contentHeight) || contentHeight <= 0) {
    return INPUT_MIN_ROWS;
  }
  const rows = Math.round(contentHeight / INPUT_LINE_HEIGHT);
  return Math.max(INPUT_MIN_ROWS, Math.min(INPUT_MAX_ROWS, rows));
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function borderColorFromResultScore(score: number): string {
  const t = clampScore(score) / 100;
  const hue = Math.round(120 * t); // 0=red, 120=green
  return `hsl(${hue}, 85%, 45%)`;
}

function cardTintFromResultScore(score: number): string {
  const t = clampScore(score) / 100;
  const hue = Math.round(120 * t);
  return `hsla(${hue}, 90%, 50%, 0.07)`;
}

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    touchWrap: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
      alignItems: "center",
      gap: 20,
    },
    avatarRing: {
      width: 132,
      height: 132,
      borderRadius: 66,
      padding: 4,
      backgroundColor: c.card,
      borderWidth: 2,
      borderColor: c.primary,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    avatarInner: {
      flex: 1,
      borderRadius: 62,
      overflow: "hidden",
      backgroundColor: c.surfaceDeep,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    questionCard: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 18,
      paddingHorizontal: 18,
      gap: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    questionLabel: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: c.primaryLight2,
    },
    questionText: {
      fontSize: 17,
      lineHeight: 26,
      fontWeight: "600",
      color: c.text,
    },
    questionHint: {
      fontSize: 14,
      lineHeight: 20,
      color: c.textMuted,
    },
    restartBtn: {
      marginTop: 4,
      alignSelf: "flex-start",
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    restartBtnText: {
      color: c.textOnPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    composerOuter: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.headerGlass,
    },
    composerInner: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 4,
    },
    inputWrap: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceInput,
      justifyContent: "flex-start",
      overflow: "hidden",
      paddingHorizontal: 14,
      paddingVertical: 0,
    },
    input: {
      width: "100%",
      fontSize: INPUT_FONT_SIZE,
      lineHeight: INPUT_LINE_HEIGHT,
      color: c.text,
      paddingVertical: INPUT_PAD_V,
      paddingHorizontal: 0,
      margin: 0,
      ...(Platform.OS === "android" && {
        textAlignVertical: "top" as const,
        includeFontPadding: false,
      }),
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    sendBtnDisabled: {
      opacity: 0.45,
    },
  });
}

const CARD_HINT =
  "Share as much as you are comfortable with — there is no wrong answer.";

export function QuestionsMeasureFlow() {
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { session, loading: authLoading, isSupabaseConfigured } = useAuth();

  const [sessionId, setSessionId] = useState<string | null>(null);
  /** Assistant turn shown in the question card (greeting, then follow-ups / summary). */
  const [assistantCardText, setAssistantCardText] = useState("");
  const [checkInFinished, setCheckInFinished] = useState(false);
  const [resultScore, setResultScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [answer, setAnswer] = useState("");
  const [rowCount, setRowCount] = useState(INPUT_MIN_ROWS);

  const answerTextRef = useRef("");
  const rowCountRef = useRef(INPUT_MIN_ROWS);
  const sizeRafRef = useRef<number | null>(null);
  const pendingContentHeightRef = useRef<number | null>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const inputOuterHeight = outerHeightForRows(rowCount);

  const resetInputLayout = () => {
    answerTextRef.current = "";
    setAnswer("");
    rowCountRef.current = INPUT_MIN_ROWS;
    setRowCount(INPUT_MIN_ROWS);
  };

  const applyContentSize = (contentHeight: number) => {
    if (answerTextRef.current.length === 0) {
      return;
    }
    const nextRows = contentHeightToRowCount(contentHeight);
    if (nextRows === rowCountRef.current) {
      return;
    }
    rowCountRef.current = nextRows;
    setRowCount(nextRows);
  };

  const scheduleContentSizeUpdate = (contentHeight: number) => {
    pendingContentHeightRef.current = contentHeight;
    if (sizeRafRef.current != null) {
      return;
    }
    sizeRafRef.current = requestAnimationFrame(() => {
      sizeRafRef.current = null;
      const h = pendingContentHeightRef.current;
      pendingContentHeightRef.current = null;
      if (h != null) {
        applyContentSize(h);
      }
    });
  };

  useEffect(() => {
    return () => {
      if (sizeRafRef.current != null) {
        cancelAnimationFrame(sizeRafRef.current);
      }
    };
  }, []);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
    [],
  );

  const bootstrapSession = useCallback(async () => {
    if (!isSupabaseConfigured || !session?.access_token) {
      setLoading(false);
      setAssistantCardText("");
      setSessionId(null);
      setError(
        !isSupabaseConfigured
          ? "Connect Supabase in .env to use check-in."
          : "Sign in to start a check-in.",
      );
      return;
    }

    setLoading(true);
    setSending(false);
    setError(null);
    setCheckInFinished(false);
    setResultScore(null);
    resetInputLayout();
    setSessionId(null);
    setAssistantCardText("");

    try {
      const res = await invokeCheckinChat({
        sessionId: null,
        message: "",
        timezone,
      });
      setSessionId(res.sessionId);
      setAssistantCardText(res.assistantMessage);
      setCheckInFinished(res.status === "finished");
      setResultScore(
        res.status === "finished" && typeof res.uiHints?.resultScore === "number"
          ? clampScore(res.uiHints.resultScore)
          : null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start check-in.");
      setSessionId(null);
      setAssistantCardText("");
    } finally {
      setLoading(false);
    }
  }, [isSupabaseConfigured, session?.access_token, timezone]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading) {
        return;
      }
      void bootstrapSession();
    }, [authLoading, bootstrapSession]),
  );

  const sendMessage = async () => {
    const text = answer.trim();
    if (
      !text ||
      sending ||
      loading ||
      !sessionId ||
      checkInFinished ||
      !session?.access_token
    ) {
      return;
    }

    Keyboard.dismiss();
    setSending(true);
    setError(null);

    try {
      const res = await invokeCheckinChat({
        sessionId,
        message: text,
        timezone,
      });
      setAssistantCardText(
        res.status === "finished" && res.finalSummary
          ? res.finalSummary
          : res.assistantMessage,
      );
      setSessionId(res.sessionId);
      setCheckInFinished(res.status === "finished");
      setResultScore(
        res.status === "finished" && typeof res.uiHints?.resultScore === "number"
          ? clampScore(res.uiHints.resultScore)
          : null,
      );
      resetInputLayout();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setSending(false);
    }
  };

  const cardTitle = checkInFinished ? "Summary" : "Your question";
  const showHint = !checkInFinished && !loading && !error;
  const inputDisabled =
    loading ||
    sending ||
    !sessionId ||
    checkInFinished ||
    !session ||
    authLoading;
  const finalCardAccent =
    checkInFinished && typeof resultScore === "number"
      ? {
          borderColor: borderColorFromResultScore(resultScore),
          borderWidth: 2,
          backgroundColor: cardTintFromResultScore(resultScore),
        }
      : null;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : Platform.OS === "android"
            ? "height"
            : undefined
      }
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback
        accessible={false}
        onPress={Keyboard.dismiss}
      >
        <View style={styles.touchWrap}>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                <Image
                  source={DOCTOR_AVATAR}
                  style={styles.avatarImage}
                  contentFit="cover"
                  accessibilityLabel="Virtual care guide"
                />
              </View>
            </View>

            <View style={[styles.questionCard, finalCardAccent]}>
              <Text style={styles.questionLabel}>{cardTitle}</Text>
              {loading || authLoading ? (
                <View style={{ paddingVertical: 12, alignItems: "flex-start" }}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <Text style={styles.questionText}>
                  {error
                    ? error
                    : assistantCardText ||
                      "Waiting to start…"}
                </Text>
              )}
              {showHint ? (
                <Text style={styles.questionHint}>{CARD_HINT}</Text>
              ) : null}
              {checkInFinished && !loading && !authLoading && !error ? (
                <Pressable
                  style={styles.restartBtn}
                  onPress={() => {
                    void bootstrapSession();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Start check-in again"
                >
                  <Text style={styles.restartBtnText}>Start check-in again</Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>

      <View
        style={[
          styles.composerOuter,
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}
      >
        <View style={styles.composerInner}>
          <View
            style={[
              styles.inputWrap,
              {
                height: inputOuterHeight,
                minHeight: INPUT_MIN_OUTER_HEIGHT,
                maxHeight: INPUT_MAX_OUTER_HEIGHT,
              },
            ]}
          >
            <TextInput
              value={answer}
              editable={!inputDisabled}
              onChangeText={(text) => {
                answerTextRef.current = text;
                setAnswer(text);
                if (text.length === 0) {
                  if (sizeRafRef.current != null) {
                    cancelAnimationFrame(sizeRafRef.current);
                    sizeRafRef.current = null;
                  }
                  pendingContentHeightRef.current = null;
                  rowCountRef.current = INPUT_MIN_ROWS;
                  setRowCount(INPUT_MIN_ROWS);
                }
              }}
              placeholder="Type your answer…"
              placeholderTextColor={colors.textMuted}
              ref={inputRef}
              style={[styles.input, { height: inputOuterHeight }]}
              multiline
              scrollEnabled
              onContentSizeChange={(e) => {
                scheduleContentSizeUpdate(e.nativeEvent.contentSize.height);
              }}
              onSelectionChange={(ev) => {
                const t = answerTextRef.current;
                if (t.length === 0) {
                  return;
                }
                const { start, end } = ev.nativeEvent.selection;
                if (start !== end || end !== t.length) {
                  return;
                }
                requestAnimationFrame(() => {
                  const rn = inputRef.current as
                    | (TextInput & {
                        getScrollResponder?: () => {
                          scrollToEnd?: (opts: { animated?: boolean }) => void;
                        };
                      })
                    | null;
                  rn?.getScrollResponder?.()?.scrollToEnd?.({ animated: false });
                });
              }}
              textAlignVertical="top"
              autoCapitalize="sentences"
              autoCorrect
              returnKeyType="default"
              blurOnSubmit={false}
              underlineColorAndroid="transparent"
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              (pressed || inputDisabled || !answer.trim()) &&
                styles.sendBtnDisabled,
            ]}
            disabled={
              inputDisabled ||
              sending ||
              !answer.trim()
            }
            onPress={() => {
              void sendMessage();
            }}
            accessibilityRole="button"
            accessibilityLabel="Send answer"
          >
            {sending ? (
              <ActivityIndicator color={colors.textOnPrimary} size="small" />
            ) : (
              <Ionicons
                name="send"
                size={22}
                color={colors.textOnPrimary}
              />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
