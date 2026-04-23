import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import type { DiscoverItem, DiscoverMediaType } from "@/features/discover/item-detail/types";
import { mediaPlayerHtml } from "@/features/discover/item-detail/utils/media";

type Props = {
  open: boolean;
  item: DiscoverItem | undefined;
  mediaType: DiscoverMediaType;
  mediaUrl?: string;
  insetsTop: number;
  onClose: () => void;
};

export function DiscoverItemViewerModal({
  open,
  item,
  mediaType,
  mediaUrl,
  insetsTop,
  onClose,
}: Props) {
  return (
    <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={local.viewerRoot}>
        <View style={[local.viewerTopBar, { paddingTop: Math.max(insetsTop, 8) }]}>
          <Text style={local.viewerTitle} numberOfLines={1}>
            {item?.title ?? "Media"}
          </Text>
          <Pressable style={local.viewerCloseBtn} onPress={onClose} accessibilityRole="button">
            <Text style={local.viewerCloseBtnText}>Close</Text>
          </Pressable>
        </View>
        {mediaUrl ? (
          mediaType === "video" ? (
            <WebView source={{ html: mediaPlayerHtml("video", mediaUrl, item?.thumbUrl) }} style={local.fill} />
          ) : mediaType === "audio" ? (
            <WebView source={{ html: mediaPlayerHtml("audio", mediaUrl) }} style={local.fill} />
          ) : (
            <WebView source={{ uri: mediaUrl }} style={local.fill} />
          )
        ) : (
          <View style={local.emptyWrap}>
            <Text style={local.emptyText}>No media URL is available for this item.</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const local = StyleSheet.create({
  viewerRoot: { flex: 1, backgroundColor: "#000" },
  viewerTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  viewerTitle: { color: "#fff", fontSize: 14, fontWeight: "700", flex: 1, marginRight: 8 },
  viewerCloseBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)" },
  viewerCloseBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  fill: { flex: 1, backgroundColor: "#000" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { color: "#fff", textAlign: "center" },
});
