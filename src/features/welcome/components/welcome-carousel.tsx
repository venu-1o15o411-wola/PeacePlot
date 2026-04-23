import React from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Text, View } from "react-native";

import { CAROUSEL_H, SLIDES } from "@/features/welcome/constants/welcome-slides";

type Props = {
  width: number;
  index: number;
  styles: ReturnType<typeof import("@/features/welcome/styles/welcome-styles").createWelcomeStyles>;
  onScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export function WelcomeCarousel({ width, index, styles, onScrollEnd }: Props) {
  return (
    <View>
      <FlatList
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          <View style={{ width, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }}>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideBody}>{item.body}</Text>
          </View>
        )}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        style={{ height: CAROUSEL_H, width }}
      />
      <View style={styles.pagination}>
        {SLIDES.map((_, i) => (
          <View key={String(i)} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}
