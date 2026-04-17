import { Image } from "expo-image";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePeacePlotColors } from "@/providers/peaceplot-appearance";
import type { PeacePlotPalette } from "@/theme/peaceplot-theme";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(WINDOW_WIDTH - 48, 340);
const QUOTE_ART_RATIO = 1376 / 768;

const QUOTE_IMAGES: { id: string; image: number }[] = [
  { id: "1", image: require("../../../assets/images/landing/quotes/1.png") },
  { id: "2", image: require("../../../assets/images/landing/quotes/2.png") },
  { id: "3", image: require("../../../assets/images/landing/quotes/3.png") },
  { id: "4", image: require("../../../assets/images/landing/quotes/4.png") },
  { id: "5", image: require("../../../assets/images/landing/quotes/5.png") },
];

function createStyles(c: PeacePlotPalette) {
  return StyleSheet.create({
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: c.text,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    listContent: {
      paddingRight: 16,
    },
    card: {
      marginRight: 16,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    artwork: {
      width: CARD_WIDTH,
      aspectRatio: QUOTE_ART_RATIO,
      backgroundColor: c.surfaceDeep,
    },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
      marginTop: 12,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.dotInactive,
    },
    dotActive: {
      backgroundColor: c.primary,
      width: 18,
    },
  });
}

export function DoctorQuotesSlider() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const colors = usePeacePlotColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / (CARD_WIDTH + 16));
    setIndex(i);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>From our doctors</Text>
      <FlatList
        ref={listRef}
        data={QUOTE_IMAGES}
        horizontal
        pagingEnabled={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={item.image}
              style={styles.artwork}
              contentFit="contain"
              accessibilityLabel={`Doctor quote image ${item.id}`}
            />
          </View>
        )}
      />
      <View style={styles.dots}>
        {QUOTE_IMAGES.map((q, i) => (
          <View
            key={q.id}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}
