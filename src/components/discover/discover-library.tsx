import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    DISCOVER_CHIPS,
    type DiscoverChipId,
    type DiscoverModality,
} from "@/data/discover-mock";
import {
    clearSuppressedDiscoverItemIds,
    fetchDiscoverFeatured,
    fetchDiscoverFeed,
    getSuppressedDiscoverItemIds,
    warmDiscoverCache,
    type DiscoverRemoteItem,
} from "@/lib/discover-feed";
import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

function modalityIcon(
  m: DiscoverModality,
): keyof typeof Ionicons.glyphMap {
  switch (m) {
    case "book":
      return "book-outline";
    case "video":
      return "play-circle-outline";
    case "music":
      return "musical-notes-outline";
    case "story":
      return "reader-outline";
    case "yoga":
      return "body-outline";
    case "tai-chi":
      return "fitness-outline";
    case "place":
      return "location-outline";
    case "ai":
      return "sparkles-outline";
    default:
      return "ellipse-outline";
  }
}

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    intro: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    introTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
      marginBottom: 6,
    },
    introSub: {
      fontSize: 14,
      lineHeight: 20,
      color: c.textBody,
    },
    searchWrap: {
      marginHorizontal: 16,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      backgroundColor: c.surfaceInput,
      paddingHorizontal: 12,
      minHeight: 46,
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: c.text,
      paddingVertical: 8,
    },
    hiddenToolsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    hiddenBtn: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    hiddenBtnActive: {
      borderColor: c.primary,
      backgroundColor: c.surfaceDeep,
    },
    hiddenBtnText: {
      color: c.text,
      fontSize: 12,
      fontWeight: "700",
    },
    hiddenMeta: {
      color: c.textMuted,
      fontSize: 12,
    },
    chipScroll: {
      marginBottom: 16,
      paddingLeft: 16,
      maxHeight: 44,
    },
    chipScrollContent: {
      gap: 8,
      paddingRight: 16,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: c.card,
      borderColor: c.border,
    },
    chipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: c.textBody,
    },
    chipLabelActive: {
      color: c.textOnPrimary,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.1,
      color: c.textMuted,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    featuredCard: {
      width: 200,
      marginRight: 12,
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    featuredVisual: {
      height: 100,
      backgroundColor: c.surfaceDeep,
      alignItems: "center",
      justifyContent: "center",
    },
    featuredBody: {
      padding: 12,
    },
    featuredTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: c.text,
      marginBottom: 4,
    },
    featuredMeta: {
      fontSize: 12,
      color: c.textMuted,
    },
    row: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    rowPressed: {
      backgroundColor: c.pressHighlight,
    },
    thumb: {
      width: 72,
      height: 72,
      borderRadius: 10,
      backgroundColor: c.surfaceDeep,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    rowBody: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: c.text,
      marginBottom: 4,
    },
    rowSub: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textBody,
      marginBottom: 6,
    },
    rowMeta: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    metaPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: c.textMuted,
      fontWeight: "500",
    },
    doctorBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: "rgba(33, 150, 243, 0.18)",
    },
    doctorBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      color: c.primary,
      letterSpacing: 0.4,
    },
    hiddenBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: "rgba(244, 67, 54, 0.15)",
      borderWidth: 1,
      borderColor: "rgba(244, 67, 54, 0.35)",
    },
    hiddenBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      color: "#f87171",
      letterSpacing: 0.4,
    },
    listContent: {
      paddingBottom: 120,
    },
    empty: {
      paddingHorizontal: 24,
      paddingVertical: 32,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 15,
      color: c.textMuted,
      textAlign: "center",
    },
  });
}

function FeaturedCard({
  item,
  colors,
  styles,
  onPress,
}: {
  item: DiscoverRemoteItem;
  colors: PeacePlotPalette;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
}) {
  const icon = modalityIcon(item.modality);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.featuredCard,
        pressed && { opacity: 0.92 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.duration}`}
    >
      <View style={styles.featuredVisual}>
        {item.thumbUrl ? (
          <Image
            source={{ uri: item.thumbUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <Ionicons name={icon} size={40} color={colors.primary} />
        )}
      </View>
      <View style={styles.featuredBody}>
        <Text style={styles.featuredTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.featuredMeta} numberOfLines={1}>
          {item.duration}
        </Text>
      </View>
    </Pressable>
  );
}

function DiscoverRow({
  item,
  colors,
  styles,
  onPress,
  isHidden,
}: {
  item: DiscoverRemoteItem;
  colors: PeacePlotPalette;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
  isHidden: boolean;
}) {
  const icon = modalityIcon(item.modality);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.subtitle}`}
    >
      <View style={styles.thumb}>
        {item.thumbUrl ? (
          <Image
            source={{ uri: item.thumbUrl }}
            style={{ width: "100%", height: "100%", borderRadius: 10 }}
            contentFit="cover"
          />
        ) : (
          <Ionicons name={icon} size={28} color={colors.primary} />
        )}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.rowSub} numberOfLines={2}>
          {item.subtitle}
        </Text>
        <View style={styles.rowMeta}>
          <View style={styles.metaPill}>
            <Ionicons
              name={icon}
              size={14}
              color={colors.textMuted}
            />
            <Text style={styles.metaText}>{item.duration}</Text>
          </View>
          {item.doctorBadge ? (
            <View style={styles.doctorBadge}>
              <Text style={styles.doctorBadgeText}>TRUSTED PICK</Text>
            </View>
          ) : null}
          {isHidden ? (
            <View style={styles.hiddenBadge}>
              <Text style={styles.hiddenBadgeText}>HIDDEN</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textMuted}
        style={{ alignSelf: "center" }}
      />
    </Pressable>
  );
}

type DiscoverLibraryProps = {
  colors: PeacePlotPalette;
};

export function DiscoverLibrary({ colors }: DiscoverLibraryProps) {
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<DiscoverChipId>("all");
  const [featured, setFeatured] = useState<DiscoverRemoteItem[]>([]);
  const [listData, setListData] = useState<DiscoverRemoteItem[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState<number | null>(2);
  const [error, setError] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [suppressedIds, setSuppressedIds] = useState<Set<string>>(new Set());

  const preferProviderItems = React.useCallback(
    (items: DiscoverRemoteItem[]): DiscoverRemoteItem[] => {
      if (chip === "ai") return items;
      const real = items.filter((x) => x.source !== "seed");
      // Music must be provider-only (no synthetic "loop" fallback).
      if (chip === "music") return real;
      // Keep infinite list alive: prefer provider, but fallback to seed when provider is empty.
      return real.length > 0 ? real : items;
    },
    [chip],
  );

  React.useEffect(() => {
    let active = true;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
    setLoadingFeatured(true);
    void fetchDiscoverFeatured(tz)
      .then((items) => {
        if (!active) return;
        setFeatured(items.slice(0, 5));
      })
      .catch(() => {
        if (!active) return;
        setError("Could not load featured right now.");
      })
      .finally(() => {
        if (!active) return;
        setLoadingFeatured(false);
        // Best-effort background warm-up so later category opens are faster.
        void warmDiscoverCache({ category: "all", page: 1 });
      });
    return () => {
      active = false;
    };
  }, []);

  const refreshHiddenCount = React.useCallback(async () => {
    const suppressed = await getSuppressedDiscoverItemIds();
    setSuppressedIds(suppressed);
    setHiddenCount(suppressed.size);
  }, []);

  React.useEffect(() => {
    void refreshHiddenCount();
  }, [refreshHiddenCount, chip, query, showHidden]);

  React.useEffect(() => {
    let active = true;
    const handle = setTimeout(() => {
      setLoadingList(true);
      setError(null);
      void fetchDiscoverFeed({
        category: chip,
        query,
        page: 1,
        pageSize: 15,
      })
        .then(async (res) => {
          if (!active) return;
          const suppressed = await getSuppressedDiscoverItemIds();
          const seen = new Set<string>();
          const preferred = preferProviderItems(res.items);
          const deduped = preferred.filter((x) => {
            if (!showHidden && suppressed.has(x.id)) return false;
            if (seen.has(x.id)) return false;
            seen.add(x.id);
            return true;
          });
          setListData(deduped);
          if (chip === "music" && deduped.length === 0) {
            setError(
              "No suitable provider music is available now. Pull to refresh or try again shortly.",
            );
          }
          setHasMore(res.hasMore);
          setNextPage(res.nextPage ?? null);
        })
        .catch((e) => {
          if (!active) return;
          setError(e instanceof Error ? e.message : "Could not load library.");
          setListData([]);
          setHasMore(false);
          setNextPage(null);
        })
        .finally(() => {
          if (!active) return;
          setLoadingList(false);
        });
    }, 220);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [chip, query, showHidden, preferProviderItems]);

  const openItem = (item: DiscoverRemoteItem) => {
    router.push({
      pathname: "/(drawer)/(tabs)/discover/item/[id]",
      params: {
        id: item.id,
        payload: encodeURIComponent(JSON.stringify(item)),
      },
    } as Href);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore || loadingList || nextPage == null) {
      return;
    }
    setLoadingMore(true);
    void fetchDiscoverFeed({
      category: chip,
      query,
      page: nextPage,
      pageSize: 15,
    })
      .then(async (res) => {
        const suppressed = await getSuppressedDiscoverItemIds();
        const preferred = preferProviderItems(res.items);
        setListData((prev) => {
          const seen = new Set(prev.map((x) => x.id));
          const merged = [...prev];
          for (const item of preferred) {
            if (!showHidden && suppressed.has(item.id)) continue;
            if (!seen.has(item.id)) {
              seen.add(item.id);
              merged.push(item);
            }
          }
          return merged;
        });
        setHasMore(res.hasMore);
        setNextPage(res.nextPage ?? null);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  };

  const header = (
    <View>
      <View style={styles.intro}>
        <Text style={styles.introTitle}>Discover</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons
          name="search-outline"
          size={22}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search titles and topics"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Search library"
        />
      </View>
      <View style={styles.hiddenToolsRow}>
        <Pressable
          style={[styles.hiddenBtn, showHidden && styles.hiddenBtnActive]}
          onPress={() => setShowHidden((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="Toggle showing hidden discover items"
        >
          <Text style={styles.hiddenBtnText}>
            {showHidden ? "Hide hidden items" : "Show hidden items"}
          </Text>
        </Pressable>
        <Pressable
          style={styles.hiddenBtn}
          onPress={async () => {
            await clearSuppressedDiscoverItemIds();
            await refreshHiddenCount();
            setShowHidden(false);
          }}
          accessibilityRole="button"
          accessibilityLabel="Clear hidden discover items"
        >
          <Text style={styles.hiddenBtnText}>Clear hidden</Text>
        </Pressable>
        <Text style={styles.hiddenMeta}>{hiddenCount} hidden</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipScrollContent}
      >
        {DISCOVER_CHIPS.map((cItem) => {
          const active = chip === cItem.id;
          return (
            <Pressable
              key={cItem.id}
              onPress={() => setChip(cItem.id)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Filter ${cItem.label}`}
            >
              <Text
                style={[styles.chipLabel, active && styles.chipLabelActive]}
              >
                {cItem.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionLabel}>FEATURED</Text>
      {loadingFeatured ? (
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingLeft: 16,
            paddingRight: 8,
            paddingBottom: 16,
          }}
        >
          {featured.map((item) => (
            <FeaturedCard
              key={item.id}
              item={item}
              colors={colors}
              styles={styles}
              onPress={() => openItem(item)}
            />
          ))}
        </ScrollView>
      )}

      <Text style={styles.sectionLabel}>LIBRARY</Text>
      {loadingList ? (
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
      {error ? (
        <Text style={[styles.emptyText, { paddingHorizontal: 20, paddingBottom: 10 }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );

  return (
    <FlatList
      data={loadingList ? [] : listData}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      onEndReachedThreshold={0.45}
      onEndReached={loadMore}
      ListEmptyComponent={
        loadingList ? null : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Nothing matches this filter yet. Try another category or search term.
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => (
        <DiscoverRow
          item={item}
          colors={colors}
          styles={styles}
          onPress={() => openItem(item)}
          isHidden={showHidden && suppressedIds.has(item.id)}
        />
      )}
      ListFooterComponent={
        loadingMore ? (
          <View style={{ paddingVertical: 14 }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}
