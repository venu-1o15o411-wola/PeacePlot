import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DiscoverItemActionRow } from "@/features/discover/item-detail/components/discover-item-action-row";
import { DiscoverItemMediaPreview } from "@/features/discover/item-detail/components/discover-item-media-preview";
import { DiscoverItemNotFound } from "@/features/discover/item-detail/components/discover-item-not-found";
import { DiscoverItemViewerModal } from "@/features/discover/item-detail/components/discover-item-viewer-modal";
import { useDiscoverItemData } from "@/features/discover/item-detail/hooks/use-discover-item-data";
import { useDiscoverItemFeedback } from "@/features/discover/item-detail/hooks/use-discover-item-feedback";
import { createDiscoverItemStyles } from "@/features/discover/item-detail/styles";
import { resolveMediaType } from "@/features/discover/item-detail/utils/media";
import { usePeacePlotColors } from "@/providers/peaceplot-appearance";

export function DiscoverItemScreen() {
  const { id, payload } = useLocalSearchParams<{ id: string; payload?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createDiscoverItemStyles(colors), [colors]);
  const [mediaLoadFailed, setMediaLoadFailed] = useState(false);
  const [openViewer, setOpenViewer] = useState(false);
  const { item, loading } = useDiscoverItemData(id ? String(id) : undefined, payload ? String(payload) : undefined);
  const { actionState, sendAction } = useDiscoverItemFeedback({
    item,
    onHiddenItem: () => router.back(),
  });

  const mediaType = resolveMediaType(item);
  const mediaUrl = item?.contentUrl ?? (mediaType === "image" ? item?.thumbUrl : undefined);
  const hasOpenableMedia = Boolean(mediaUrl && /^https?:\/\//i.test(mediaUrl));

  if (!loading && !item) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <DiscoverItemNotFound
          styles={styles}
          insetsTop={insets.top}
          textColor={colors.text}
          bodyColor={colors.textBody}
          onBack={() => router.back()}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow} accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.backLabel}>Discover</Text>
        </Pressable>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.badgeRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{item?.duration ?? "—"}</Text>
            </View>
            {item?.doctorBadge ? (
              <View style={[styles.pill, { borderColor: colors.primary }]}>
                <Text style={[styles.pillText, { color: colors.primary }]}>Trusted pick</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.title}>{loading ? "Loading..." : (item?.title ?? "Discover item")}</Text>
          <Text style={styles.sub}>{item?.subtitle ?? "Preparing item preview."}</Text>
          <View style={styles.mediaFrame}>
            <DiscoverItemMediaPreview
              item={item}
              loading={loading}
              mediaType={mediaType}
              mediaUrl={mediaUrl}
              mediaLoadFailed={mediaLoadFailed}
              colors={{ primary: colors.primary, textMuted: colors.textMuted }}
              styles={styles}
              onMediaFail={() => setMediaLoadFailed(true)}
              onOpenViewer={() => setOpenViewer(true)}
            />
          </View>
          {hasOpenableMedia ? (
            <Pressable style={styles.primaryOpenBtn} onPress={() => setOpenViewer(true)}>
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
          <DiscoverItemActionRow styles={styles} actionState={actionState} onAction={sendAction} />
          <Text style={styles.disclaimer}>
            Wellness information only — not a substitute for professional care.
          </Text>
        </ScrollView>
      </View>
      <DiscoverItemViewerModal
        open={openViewer}
        item={item}
        mediaType={mediaType}
        mediaUrl={mediaUrl}
        insetsTop={insets.top}
        onClose={() => setOpenViewer(false)}
      />
    </>
  );
}
