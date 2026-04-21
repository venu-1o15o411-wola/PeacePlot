import Ionicons from "@expo/vector-icons/Ionicons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import {
  fetchDiscoverItemById,
  sendDiscoverFeedback,
  suppressDiscoverItemId,
  type DiscoverRemoteItem,
} from "@/lib/discover-feed";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";
import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

function mediaPlayerHtml(kind: "audio" | "video", url: string, posterUrl?: string): string {
  const safeUrl = encodeURI(url);
  const safePoster = posterUrl ? encodeURI(posterUrl) : "";
  const tag = kind === "video"
    ? `<video controls playsinline webkit-playsinline preload="metadata" ${safePoster ? `poster="${safePoster}"` : ""} style="width:100%;height:100%;background:#000" src="${safeUrl}"></video>`
    : `<audio controls style="width:95%;max-width:560px" src="${safeUrl}"></audio>`;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><style>html,body{margin:0;height:100%;background:#111}body{font-family:-apple-system,system-ui;display:flex;align-items:center;justify-content:center;padding:10px}.wrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center}</style></head><body><div class="wrap">${tag}</div></body></html>`;
}

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: "transparent",
    },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 4,
    },
    backLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: c.primary,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 120,
    },
    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    pill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    pillText: {
      fontSize: 12,
      fontWeight: "600",
      color: c.textBody,
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: c.text,
      marginBottom: 8,
      lineHeight: 30,
    },
    sub: {
      fontSize: 16,
      lineHeight: 24,
      color: c.textBody,
      marginBottom: 20,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: c.textMuted,
      marginBottom: 8,
      letterSpacing: 0.8,
    },
    cardBody: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textBody,
    },
    mediaFrame: {
      height: 260,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: c.surfaceDeep,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    mediaHint: {
      fontSize: 13,
      color: c.textMuted,
      paddingHorizontal: 14,
      textAlign: "center",
    },
    readerWrap: {
      width: "100%",
      height: "100%",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    readerText: {
      color: c.text,
      fontSize: 15,
      lineHeight: 24,
    },
    openBtn: {
      marginTop: 8,
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: c.card,
    },
    openBtnText: {
      color: c.primary,
      fontWeight: "700",
      fontSize: 12,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    primaryOpenBtn: {
      borderWidth: 1,
      borderColor: c.primary,
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 9,
      marginBottom: 12,
      alignSelf: "flex-start",
    },
    primaryOpenBtnText: {
      color: c.textOnPrimary,
      fontSize: 13,
      fontWeight: "800",
    },
    actionBtn: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    actionBtnText: {
      color: c.text,
      fontSize: 12,
      fontWeight: "700",
    },
    disclaimer: {
      fontSize: 12,
      lineHeight: 18,
      color: c.textMuted,
      fontStyle: "italic",
    },
    notFound: {
      padding: 24,
    },
    viewerRoot: {
      flex: 1,
      backgroundColor: "#000",
    },
    viewerTopBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "rgba(255,255,255,0.2)",
    },
    viewerTitle: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
      flex: 1,
      marginRight: 8,
    },
    viewerCloseBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.45)",
    },
    viewerCloseBtnText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
  });
}

function resolveMediaType(item: DiscoverRemoteItem | undefined): DiscoverRemoteItem["mediaType"] {
  if (!item) return undefined;
  if (item.mediaType) return item.mediaType;
  if (item.modality === "book") return "book";
  if (item.modality === "video" || item.modality === "story") return "video";
  if (item.modality === "music") return "audio";
  if (item.modality === "place") return "image";
  if (item.modality === "ai") return "text";
  return undefined;
}

function CustomAudioPlayer({
  url,
  title,
  artist,
  coverUrl,
}: {
  url: string;
  title?: string;
  artist?: string;
  coverUrl?: string;
}) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (status.playing) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 500 });
    }
  }, [status.playing, scale]);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatTime = (seconds?: number) => {
    if (seconds == null || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent =
    status.duration && status.duration > 0
      ? (status.currentTime / status.duration) * 100
      : 0;

  const togglePlay = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  const seekBackward = () => {
    player.seekTo(Math.max(0, status.currentTime - 10));
  };

  const seekForward = () => {
    if (status.duration) {
      player.seekTo(Math.min(status.duration, status.currentTime + 10));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F1A" }}>
      <LinearGradient
        colors={["#1A1A2E", "#0F0F1A", "#000000"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <Animated.View
          style={[
            {
              width: "100%",
              aspectRatio: 1,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 48,
              elevation: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
            },
            animatedImageStyle,
          ]}
        >
          <Image
            source={{
              uri:
                coverUrl ||
                "https://images.unsplash.com/photo-1614113489855-66422ad300a4?w=800&q=80",
            }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </Animated.View>

        <View style={{ width: "100%", alignItems: "flex-start", marginBottom: 32 }}>
          <Text
            style={{
              color: "#FFF",
              fontSize: 24,
              fontWeight: "800",
              marginBottom: 8,
            }}
            numberOfLines={1}
          >
            {title || "Unknown Title"}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 16,
              fontWeight: "500",
            }}
            numberOfLines={1}
          >
            {artist || "Unknown Artist"}
          </Text>
        </View>

        <View style={{ width: "100%", marginBottom: 48 }}>
          <View
            style={{
              height: 6,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 3,
              marginBottom: 12,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                backgroundColor: "#FFF",
                width: `${progressPercent}%`,
                borderRadius: 3,
              }}
            />
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
              {formatTime(status.currentTime)}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
              {formatTime(status.duration)}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
          }}
        >
          <Pressable
            onPress={seekBackward}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            accessibilityLabel="Seek backward 10 seconds"
          >
            <Ionicons name="play-back" size={32} color="#FFF" />
          </Pressable>
          <Pressable
            onPress={togglePlay}
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "#FFF",
              alignItems: "center",
              justifyContent: "center",
            })}
            accessibilityLabel={status.playing ? "Pause" : "Play"}
          >
            <Ionicons
              name={status.playing ? "pause" : "play"}
              size={36}
              color="#0F0F1A"
              style={{ marginLeft: status.playing ? 0 : 4 }}
            />
          </Pressable>
          <Pressable
            onPress={seekForward}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            accessibilityLabel="Seek forward 10 seconds"
          >
            <Ionicons name="play-forward" size={32} color="#FFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function DiscoverItemScreen() {
  const { id, payload } = useLocalSearchParams<{ id: string; payload?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [item, setItem] = useState<DiscoverRemoteItem | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [mediaLoadFailed, setMediaLoadFailed] = useState(false);
  const [openViewer, setOpenViewer] = useState(false);
  const [openedFeedbackId, setOpenedFeedbackId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<string | null>(null);

  useEffect(() => {
    setMediaLoadFailed(false);
    let active = true;
    if (!id) {
      setItem(undefined);
      setLoading(false);
      return;
    }
    let optimistic: DiscoverRemoteItem | undefined;
    if (payload) {
      try {
        const decoded = JSON.parse(decodeURIComponent(String(payload))) as DiscoverRemoteItem;
        if (decoded && typeof decoded.id === "string") {
          optimistic = decoded;
          setItem(decoded);
        }
      } catch {
        // ignore and use network/local lookup
      }
    }
    setLoading(true);
    void fetchDiscoverItemById(String(id))
      .then((res) => {
        if (!active) return;
        if (res) {
          setItem(res);
          return;
        }
        setItem(optimistic ?? undefined);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, payload]);

  useEffect(() => {
    if (!item?.id || item.id === openedFeedbackId) return;
    setOpenedFeedbackId(item.id);
    void sendDiscoverFeedback({
      id: item.id,
      actionType: "open",
      metadata: {
        source: item.source ?? "unknown",
        mediaType: item.mediaType ?? "unknown",
      },
    });
  }, [item, openedFeedbackId]);

  const sendAction = (actionType: "save" | "hide" | "not_for_me" | "complete") => {
    if (!item?.id) return;
    setActionState(actionType);
    void sendDiscoverFeedback({
      id: item.id,
      actionType,
      metadata: {
        source: item.source ?? "unknown",
        mediaType: item.mediaType ?? "unknown",
        title: item.title,
      },
    }).finally(async () => {
      if (actionType === "hide" || actionType === "not_for_me") {
        await suppressDiscoverItemId(item.id);
        router.back();
        return;
      }
      setTimeout(() => setActionState(null), 700);
    });
  };

  const mediaType = resolveMediaType(item);
  const mediaUrl = item?.contentUrl ?? (mediaType === "image" ? item?.thumbUrl : undefined);
  const hasOpenableMedia = Boolean(mediaUrl && /^https?:\/\//i.test(mediaUrl));

  if (!loading && !item) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <View
          style={[styles.root, styles.notFound, { paddingTop: insets.top }]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backRow}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <Text style={{ fontSize: 16, color: colors.textBody }}>
            This item is not in the library yet.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backRow}
          accessibilityRole="button"
          accessibilityLabel="Back to Discover"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.backLabel}>Discover</Text>
        </Pressable>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.badgeRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{item?.duration ?? "—"}</Text>
            </View>
            {item?.doctorBadge ? (
              <View style={[styles.pill, { borderColor: colors.primary }]}>
                <Text style={[styles.pillText, { color: colors.primary }]}>
                  Trusted pick
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.title}>
            {loading ? "Loading..." : item?.title ?? "Discover item"}
          </Text>
          <Text style={styles.sub}>{item?.subtitle ?? "Preparing item preview."}</Text>

          <View style={styles.mediaFrame}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : mediaType === "image" && mediaUrl ? (
              <Image
                source={{ uri: mediaUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : mediaType === "video" && mediaUrl ? (
              mediaLoadFailed ? (
                <View style={{ width: "100%", height: "100%" }}>
                  {item?.thumbUrl ? (
                    <Image
                      source={{ uri: item.thumbUrl }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : null}
                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: 10,
                      backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>
                      Video failed to load in app for this URL.
                    </Text>
                  </View>
                </View>
              ) : (
                <WebView
                  source={{ html: mediaPlayerHtml("video", mediaUrl, item?.thumbUrl) }}
                  style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
                  mediaPlaybackRequiresUserAction={false}
                  allowsInlineMediaPlayback
                  allowsFullscreenVideo
                  originWhitelist={["*"]}
                  javaScriptEnabled
                  domStorageEnabled
                  mixedContentMode="always"
                  onError={() => setMediaLoadFailed(true)}
                  onHttpError={() => setMediaLoadFailed(true)}
                />
              )
            ) : mediaType === "audio" && mediaUrl ? (
              mediaLoadFailed ? (
                <Text style={styles.mediaHint}>
                  Audio failed to load in app for this URL.
                </Text>
              ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 12 }}>
                    Audio ready
                  </Text>
                  <Pressable
                    style={[styles.primaryOpenBtn, { alignSelf: "center", marginBottom: 0 }]}
                    onPress={() => setOpenViewer(true)}
                  >
                    <Text style={styles.primaryOpenBtnText}>Play Audio</Text>
                  </Pressable>
                </View>
              )
            ) : mediaType === "book" ? (
              item.contentUrl ? (
                <WebView
                  source={{ uri: item.contentUrl }}
                  style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
                  onError={() => setMediaLoadFailed(true)}
                  onHttpError={() => setMediaLoadFailed(true)}
                />
              ) : (
                <ScrollView style={styles.readerWrap} showsVerticalScrollIndicator={false}>
                  <Text style={styles.readerText}>
                    {item.contentText?.trim()
                      ? item.contentText
                      : `${item.title}\n\n${item.subtitle}\n\nBook preview text is unavailable for this item.`}
                  </Text>
                </ScrollView>
              )
            ) : mediaLoadFailed ? (
              <Text style={styles.mediaHint}>
                In-app player could not render this media URL on this device.
              </Text>
            ) : (
              <Text style={styles.mediaHint}>
                This content type is available in the Discover runtime, but this
                item has no direct media URL yet.
              </Text>
            )}
          </View>

          {hasOpenableMedia ? (
            <Pressable
              style={styles.primaryOpenBtn}
              onPress={() => setOpenViewer(true)}
              accessibilityRole="button"
              accessibilityLabel="Open media in full screen viewer"
            >
              <Text style={styles.primaryOpenBtnText}>Open Media</Text>
            </Pressable>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>PREVIEW</Text>
            <Text style={styles.cardBody}>
              {`Type: ${mediaType ?? "unknown"}  •  Source: ${item?.source ?? "unknown"}\n`}
              {mediaLoadFailed
                ? "In-app rendering failed for this URL on this device."
                : item?.contentUrl
                ? "In-app player/reader loaded from provider URL."
                : "No direct media URL in this card payload yet. Use source/open actions when available."}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => sendAction("save")}
              accessibilityRole="button"
              accessibilityLabel="Save this media"
            >
              <Text style={styles.actionBtnText}>
                {actionState === "save" ? "Saved" : "Save"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.actionBtn}
              onPress={() => sendAction("not_for_me")}
              accessibilityRole="button"
              accessibilityLabel="Not for me"
            >
              <Text style={styles.actionBtnText}>
                {actionState === "not_for_me" ? "Noted" : "Not for me"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.actionBtn}
              onPress={() => sendAction("hide")}
              accessibilityRole="button"
              accessibilityLabel="Hide this media"
            >
              <Text style={styles.actionBtnText}>
                {actionState === "hide" ? "Hidden" : "Hide"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.actionBtn}
              onPress={() => sendAction("complete")}
              accessibilityRole="button"
              accessibilityLabel="Mark as complete"
            >
              <Text style={styles.actionBtnText}>
                {actionState === "complete" ? "Done" : "Complete"}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.disclaimer}>
            Wellness information only — not a substitute for professional care.
            AI and location features follow the permissions and disclosures in
            the product plan.
          </Text>
        </ScrollView>
      </View>

      <Modal
        visible={openViewer}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setOpenViewer(false)}
      >
        <View style={styles.viewerRoot}>
          <View style={[styles.viewerTopBar, { paddingTop: Math.max(insets.top, 8) }]}>
            <Text style={styles.viewerTitle} numberOfLines={1}>
              {item?.title ?? "Media"}
            </Text>
            <Pressable
              style={styles.viewerCloseBtn}
              onPress={() => setOpenViewer(false)}
              accessibilityRole="button"
              accessibilityLabel="Close media viewer"
            >
              <Text style={styles.viewerCloseBtnText}>Close</Text>
            </Pressable>
          </View>
          {mediaUrl ? (
            mediaType === "video" ? (
              <WebView
                source={{ html: mediaPlayerHtml("video", mediaUrl, item?.thumbUrl) }}
                style={{ flex: 1, backgroundColor: "#000" }}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback
                allowsFullscreenVideo
                originWhitelist={["*"]}
                javaScriptEnabled
                domStorageEnabled
                mixedContentMode="always"
              />
            ) : mediaType === "audio" ? (
              <CustomAudioPlayer
                url={mediaUrl}
                title={item?.title}
                artist={item?.subtitle}
                coverUrl={item?.thumbUrl}
              />
            ) : (
              <WebView
                source={{ uri: mediaUrl }}
                style={{ flex: 1, backgroundColor: "#000" }}
                originWhitelist={["*"]}
                javaScriptEnabled
                domStorageEnabled
                mixedContentMode="always"
              />
            )
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
              <Text style={{ color: "#fff", textAlign: "center" }}>
                No media URL is available for this item.
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
