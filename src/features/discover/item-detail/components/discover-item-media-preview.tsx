import { Image } from "expo-image";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import type { DiscoverItem, DiscoverMediaType } from "@/features/discover/item-detail/types";
import { mediaPlayerHtml } from "@/features/discover/item-detail/utils/media";

type Props = {
  item: DiscoverItem | undefined;
  loading: boolean;
  mediaType: DiscoverMediaType;
  mediaUrl?: string;
  mediaLoadFailed: boolean;
  colors: { primary: string; textMuted: string };
  styles: ReturnType<typeof import("@/features/discover/item-detail/styles").createDiscoverItemStyles>;
  onMediaFail: () => void;
  onOpenViewer: () => void;
};

export function DiscoverItemMediaPreview({
  item,
  loading,
  mediaType,
  mediaUrl,
  mediaLoadFailed,
  colors,
  styles,
  onMediaFail,
  onOpenViewer,
}: Props) {
  if (loading) return <ActivityIndicator color={colors.primary} />;
  if (mediaType === "image" && mediaUrl) {
    return <Image source={{ uri: mediaUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />;
  }
  if (mediaType === "video" && mediaUrl) {
    if (mediaLoadFailed) {
      return <Text style={styles.mediaHint}>Video failed to load in app for this URL.</Text>;
    }
    return (
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
        onError={onMediaFail}
        onHttpError={onMediaFail}
      />
    );
  }
  if (mediaType === "audio" && mediaUrl) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 12 }}>
          {mediaLoadFailed ? "Audio failed to load in app for this URL." : "Audio ready"}
        </Text>
        {!mediaLoadFailed ? (
          <Pressable style={[styles.primaryOpenBtn, { alignSelf: "center", marginBottom: 0 }]} onPress={onOpenViewer}>
            <Text style={styles.primaryOpenBtnText}>Play Audio</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  if (mediaType === "book") {
    if (item?.contentUrl) {
      return (
        <WebView
          source={{ uri: item.contentUrl }}
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
          onError={onMediaFail}
          onHttpError={onMediaFail}
        />
      );
    }
    return (
      <ScrollView style={styles.readerWrap} showsVerticalScrollIndicator={false}>
        <Text style={styles.readerText}>
          {item?.contentText?.trim()
            ? item.contentText
            : `${item?.title}\n\n${item?.subtitle}\n\nBook preview text is unavailable for this item.`}
        </Text>
      </ScrollView>
    );
  }
  return (
    <Text style={styles.mediaHint}>
      {mediaLoadFailed
        ? "In-app player could not render this media URL on this device."
        : "This content type is available in the Discover runtime, but this item has no direct media URL yet."}
    </Text>
  );
}
