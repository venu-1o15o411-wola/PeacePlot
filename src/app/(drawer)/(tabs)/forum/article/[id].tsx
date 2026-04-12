import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { PeacePlotPalette } from "@/constants/peaceplot-theme";
import { usePeacePlotColors } from "@/context/peaceplot-appearance";
import {
  getArticleComments,
  getForumArticle,
  type ForumComment,
} from "@/data/forum-mock";

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    backLabel: { fontSize: 16, fontWeight: "600", color: c.primary },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 120 },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    metaText: { fontSize: 13, color: c.textMuted },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: c.text,
      marginBottom: 12,
      lineHeight: 30,
    },
    body: {
      fontSize: 16,
      lineHeight: 26,
      color: c.textBody,
      marginBottom: 20,
    },
    actions: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 24,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    actionLabel: { fontSize: 14, fontWeight: "600", color: c.text },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.1,
      color: c.textMuted,
      marginBottom: 12,
    },
    commentBlock: {
      marginBottom: 14,
      paddingBottom: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    commentAuthor: {
      fontSize: 14,
      fontWeight: "700",
      color: c.primaryLight2,
      marginBottom: 4,
    },
    commentBody: {
      fontSize: 14,
      lineHeight: 21,
      color: c.textBody,
      marginBottom: 8,
    },
    likeBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
    likeText: { fontSize: 13, color: c.textMuted, fontWeight: "600" },
    notFound: { padding: 24, fontSize: 16, color: c.textBody },
  });
}

function CommentTree({
  comment,
  depth,
  colors,
  styles,
  onCommentLike,
}: {
  comment: ForumComment;
  depth: number;
  colors: PeacePlotPalette;
  styles: ReturnType<typeof createStyles>;
  onCommentLike: () => void;
}) {
  return (
    <View
      style={{
        marginLeft: depth * 14,
        paddingLeft: depth ? 10 : 0,
        borderLeftWidth: depth ? 2 : 0,
        borderLeftColor: colors.border,
        marginBottom: 12,
      }}
    >
      <Text style={styles.commentAuthor}>{comment.author}</Text>
      <Text style={styles.commentBody}>{comment.body}</Text>
      <Pressable
        style={styles.likeBtn}
        onPress={onCommentLike}
        accessibilityRole="button"
        accessibilityLabel={`Like comment, ${comment.likes} likes`}
      >
        <Ionicons name="heart-outline" size={18} color={colors.primary} />
        <Text style={styles.likeText}>{comment.likes}</Text>
      </Pressable>
      {comment.replies?.map((r) => (
        <CommentTree
          key={r.id}
          comment={r}
          depth={depth + 1}
          colors={colors}
          styles={styles}
          onCommentLike={onCommentLike}
        />
      ))}
    </View>
  );
}

export default function ForumArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [likeBump, setLikeBump] = useState(0);

  const article = useMemo(
    () => (id ? getForumArticle(String(id)) : undefined),
    [id],
  );
  const comments = useMemo(
    () => (id ? getArticleComments(String(id)) : []),
    [id],
  );

  const onArticleLike = () => {
    setLikeBump((n) => n + 1);
    Alert.alert(
      "Likes",
      "Reactions will sync with Supabase when the forum API is connected (plan §5.3).",
    );
  };

  const onCommentLike = () => {
    /* UI-only until Supabase — avoids alert spam on each nested reply */
  };

  if (!article) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <View style={[styles.root, { paddingTop: insets.top }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backRow}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
            <Text style={styles.backLabel}>Forum</Text>
          </Pressable>
          <Text style={styles.notFound}>Article not found.</Text>
        </View>
      </>
    );
  }

  const bodyCopy =
    article.id === "a1"
      ? "Step 1: Notice your feet on the floor. Step 2: Lengthen your exhale just a little. Step 3: Name one sound you hear without judging it. Repeat for two minutes — curiosity beats perfection."
      : article.id === "a2"
        ? "Stress labels are data, not verdicts. Try: ‘I notice tightness’ instead of ‘I failed at relaxing.’ The second sentence adds shame; the first keeps you in problem-solving mode."
        : "We remove spam and harassment, surface crisis resources for self-harm mentions, and document appeals. User search will be opt-in. This is a living policy — check back as we ship tools.";

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backRow}
          accessibilityRole="button"
          accessibilityLabel="Back to Forum"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.backLabel}>Forum</Text>
        </Pressable>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{article.author}</Text>
            <Text style={styles.metaText}>·</Text>
            <Text style={styles.metaText}>{article.publishedAt}</Text>
            <Text style={styles.metaText}>·</Text>
            <Text style={styles.metaText}>{article.readTime}</Text>
          </View>

          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.body}>{bodyCopy}</Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.actionBtn}
              onPress={onArticleLike}
              accessibilityRole="button"
            >
              <Ionicons name="heart-outline" size={20} color={colors.primary} />
              <Text style={styles.actionLabel}>
                {article.likeCount + likeBump}
              </Text>
            </Pressable>
            <View style={styles.actionBtn}>
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={colors.textMuted}
              />
              <Text style={[styles.actionLabel, { color: colors.textMuted }]}>
                {article.commentCount} comments
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>THREADED COMMENTS</Text>
          {comments.length === 0 ? (
            <Text style={styles.body}>
              No comments yet — tree replies and likes will persist with
              Supabase.
            </Text>
          ) : (
            comments.map((c) => (
              <CommentTree
                key={c.id}
                comment={c}
                depth={0}
                colors={colors}
                styles={styles}
                onCommentLike={onCommentLike}
              />
            ))
          )}

          <Text
            style={[styles.body, { fontSize: 12, marginTop: 16, opacity: 0.85 }]}
          >
            Wellness information only. For emergencies, contact local services.
          </Text>
        </ScrollView>
      </View>
    </>
  );
}
