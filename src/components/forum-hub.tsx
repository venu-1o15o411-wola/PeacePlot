import Ionicons from "@expo/vector-icons/Ionicons";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
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
  FORUM_ARTICLES,
  FORUM_ROOMS,
  type ForumArticle,
  type ForumChipId,
  type ForumRoom,
} from "@/data/forum-mock";

const CHIPS: { id: ForumChipId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "articles", label: "Articles" },
  { id: "rooms", label: "Chat rooms" },
  { id: "chatbot", label: "Chatbot" },
];

type Row =
  | { key: string; kind: "chatbot" }
  | { key: string; kind: "article"; item: ForumArticle }
  | { key: string; kind: "room"; item: ForumRoom };

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    intro: {
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    title: {
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
    guidelinesCard: {
      marginHorizontal: 16,
      marginBottom: 14,
      padding: 14,
      borderRadius: 12,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    guidelinesText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: c.textBody,
    },
    guidelinesLink: {
      fontSize: 13,
      fontWeight: "700",
      color: c.primary,
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
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: c.text,
      paddingVertical: 8,
    },
    chipScroll: {
      marginBottom: 12,
      paddingLeft: 16,
      maxHeight: 44,
    },
    chipScrollContent: { gap: 8, paddingRight: 16 },
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
    chipLabel: { fontSize: 13, fontWeight: "600", color: c.textBody },
    chipLabelActive: { color: c.textOnPrimary },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.1,
      color: c.textMuted,
      paddingHorizontal: 16,
      marginBottom: 8,
      marginTop: 4,
    },
    chatbotCard: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 16,
      borderRadius: 12,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.primary,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    chatbotIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 12,
      backgroundColor: "rgba(33, 150, 243, 0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    chatbotTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: c.text,
      marginBottom: 4,
    },
    chatbotSub: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textBody,
    },
    row: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 14,
      borderRadius: 12,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    rowPressed: { backgroundColor: c.pressHighlight },
    rowIcon: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: c.surfaceDeep,
      alignItems: "center",
      justifyContent: "center",
    },
    rowBody: { flex: 1, minWidth: 0 },
    rowTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: c.text,
      marginBottom: 4,
    },
    rowExcerpt: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textBody,
      marginBottom: 8,
    },
    rowMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      alignItems: "center",
    },
    metaText: { fontSize: 12, color: c.textMuted },
    liveBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: "rgba(33, 150, 243, 0.2)",
    },
    liveText: {
      fontSize: 10,
      fontWeight: "800",
      color: c.primary,
      letterSpacing: 0.5,
    },
    listPad: { paddingBottom: 120 },
    empty: {
      paddingHorizontal: 24,
      paddingVertical: 28,
      alignItems: "center",
    },
    emptyText: { fontSize: 15, color: c.textMuted, textAlign: "center" },
  });
}

function showCommunityGuidelines() {
  Alert.alert(
    "Community guidelines",
    [
      "Be kind and respect boundaries — no harassment, hate, or doxxing.",
      "Wellness focus: PeacePlot is not for emergency care. If you may harm yourself or others, contact local emergency services or a crisis line — we’ll add one-tap resources in a future build.",
      "Reporting: use Report on posts when available; moderation tooling will scale with the forum.",
      "User search (by userid/email) will be opt-in and rate-limited when shipped — see the product plan.",
    ].join("\n\n"),
    [{ text: "OK" }],
  );
}

export function ForumHub({ colors }: { colors: PeacePlotPalette }) {
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<ForumChipId>("all");

  const rows = useMemo((): Row[] => {
    const q = query.trim().toLowerCase();
    const match = (s: string) => !q || s.toLowerCase().includes(q);

    const out: Row[] = [];

    const wantChatbot = chip === "all" || chip === "chatbot";
    const wantArticles = chip === "all" || chip === "articles";
    const wantRooms = chip === "all" || chip === "rooms";

    if (wantChatbot) {
      const chatbotHaystack =
        "peaceplot assistant chatbot triage guide support";
      if (!q || chatbotHaystack.includes(q)) {
        out.push({ key: "chatbot", kind: "chatbot" });
      }
    }

    if (wantArticles) {
      FORUM_ARTICLES.forEach((item) => {
        if (
          match(
            `${item.title} ${item.excerpt} ${item.author} article`,
          )
        ) {
          out.push({ key: `a-${item.id}`, kind: "article", item });
        }
      });
    }

    if (wantRooms) {
      FORUM_ROOMS.forEach((item) => {
        if (match(`${item.name} ${item.topic} room chat`)) {
          out.push({ key: `r-${item.id}`, kind: "room", item });
        }
      });
    }

    return out;
  }, [query, chip]);

  const header = (
    <View>
      <View style={styles.intro}>
        <Text style={styles.title}>Forum</Text>
        <Text style={styles.introSub}>
          Articles, peer rooms, and a guided assistant — tree comments and
          likes only in v1, with clear safety copy (see guidelines).
        </Text>
      </View>

      <Pressable
        onPress={showCommunityGuidelines}
        style={({ pressed }) => [
          styles.guidelinesCard,
          pressed && { opacity: 0.92 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Read community guidelines"
      >
        <Ionicons
          name="shield-checkmark-outline"
          size={22}
          color={colors.primary}
        />
        <Text style={styles.guidelinesText}>
          Peer support works best with shared rules.{" "}
          <Text style={styles.guidelinesLink}>Tap to read guidelines</Text> —
          crisis resources and reporting will expand as the forum grows.
        </Text>
      </Pressable>

      <View style={styles.searchWrap}>
        <Ionicons
          name="search-outline"
          size={22}
          color={colors.textMuted}
          style={{ marginRight: 8 }}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search articles and rooms"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search forum"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipScrollContent}
      >
        {CHIPS.map((cItem) => {
          const active = chip === cItem.id;
          return (
            <Pressable
              key={cItem.id}
              onPress={() => setChip(cItem.id)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
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

      <Text style={styles.sectionLabel}>COMMUNITY</Text>
    </View>
  );

  const renderRow = ({ item }: { item: Row }) => {
    if (item.kind === "chatbot") {
      return (
        <Pressable
          style={({ pressed }) => [
            styles.chatbotCard,
            pressed && { opacity: 0.94 },
          ]}
          onPress={() =>
            router.push("/(drawer)/(tabs)/forum/chatbot" as Href)
          }
          accessibilityRole="button"
          accessibilityLabel="Open PeacePlot assistant chatbot"
        >
          <View style={styles.chatbotIconWrap}>
            <Ionicons name="chatbubbles" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatbotTitle}>PeacePlot assistant</Text>
            <Text style={styles.chatbotSub}>
              Ask short questions — we’ll triage you to articles, Measure, or
              human support paths when backend chat is live.
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={22}
            color={colors.textMuted}
          />
        </Pressable>
      );
    }

    if (item.kind === "article") {
      const a = item.item;
      return (
        <Pressable
          style={({ pressed }) => [
            styles.row,
            pressed && styles.rowPressed,
          ]}
          onPress={() =>
            router.push(`/(drawer)/(tabs)/forum/article/${a.id}` as Href)
          }
          accessibilityRole="button"
        >
          <View style={styles.rowIcon}>
            <Ionicons name="newspaper-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle} numberOfLines={2}>
              {a.title}
            </Text>
            <Text style={styles.rowExcerpt} numberOfLines={2}>
              {a.excerpt}
            </Text>
            <View style={styles.rowMeta}>
              <Text style={styles.metaText}>{a.author}</Text>
              <Text style={styles.metaText}>·</Text>
              <Text style={styles.metaText}>{a.publishedAt}</Text>
              <Text style={styles.metaText}>·</Text>
              <Text style={styles.metaText}>{a.readTime}</Text>
              <Ionicons
                name="chatbubble-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.metaText}>{a.commentCount}</Text>
              <Ionicons
                name="heart-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.metaText}>{a.likeCount}</Text>
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

    const r = item.item;
    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() =>
          router.push(`/(drawer)/(tabs)/forum/room/${r.id}` as Href)
        }
        accessibilityRole="button"
      >
        <View style={styles.rowIcon}>
          <Ionicons name="people-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.rowBody}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Text style={styles.rowTitle} numberOfLines={1}>
              {r.name}
            </Text>
            {r.isLive ? (
              <View style={styles.liveBadge}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.rowExcerpt} numberOfLines={2}>
            {r.topic}
          </Text>
          <Text style={styles.metaText}>
            ~{r.membersApprox} members · threaded chat when connected
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textMuted}
          style={{ alignSelf: "center" }}
        />
      </Pressable>
    );
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.key}
      ListHeaderComponent={header}
      renderItem={renderRow}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No matches. Try another filter or clear search — live data will
            come from Supabase per the build plan.
          </Text>
        </View>
      }
      contentContainerStyle={styles.listPad}
      showsVerticalScrollIndicator={false}
    />
  );
}
