import Ionicons from "@expo/vector-icons/Ionicons";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { PeacePlotPalette } from "@/constants/peaceplot-theme";
import {
  DISCOVER_CHIPS,
  DISCOVER_ITEMS,
  type DiscoverChipId,
  type DiscoverItem,
  type DiscoverModality,
  modalityMatchesChip,
} from "@/data/discover-mock";

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
  item: DiscoverItem;
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
        <Ionicons name={icon} size={40} color={colors.primary} />
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
}: {
  item: DiscoverItem;
  colors: PeacePlotPalette;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
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
        <Ionicons name={icon} size={28} color={colors.primary} />
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

  const featured = useMemo(
    () => DISCOVER_ITEMS.filter((x) => x.featured).slice(0, 6),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DISCOVER_ITEMS.filter((item) => {
      if (!modalityMatchesChip(item.modality, chip)) return false;
      if (!q) return true;
      const blob = `${item.title} ${item.subtitle}`.toLowerCase();
      return blob.includes(q);
    });
  }, [query, chip]);

  /** Avoid duplicate rows under Featured when browsing without search. */
  const listData = useMemo(() => {
    const q = query.trim();
    if (q) return filtered;
    return filtered.filter((item) => !item.featured);
  }, [filtered, query]);

  const openItem = (id: string) => {
    router.push(`/(drawer)/(tabs)/discover/item/${id}` as Href);
  };

  const header = (
    <View>
      <View style={styles.intro}>
        <Text style={styles.introTitle}>Discover</Text>
        <Text style={styles.introSub}>
          Books, media, music, movement, places, and AI guidance — each item
          shows duration and format so you can choose calmly, not scroll
          blindly.
        </Text>
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
            onPress={() => openItem(item.id)}
          />
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>LIBRARY</Text>
    </View>
  );

  return (
    <FlatList
      data={listData}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Nothing matches this filter yet. Try All or another category —
            library data will connect to Supabase per the product plan.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <DiscoverRow
          item={item}
          colors={colors}
          styles={styles}
          onPress={() => openItem(item.id)}
        />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}
