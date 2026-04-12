import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PeacePlotColors } from '@/constants/peaceplot-theme';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(WINDOW_WIDTH - 48, 340);

/** Placeholder trust-layer quotes (plan §4.3, §5.4) — replace with CMS / Supabase content. */
const PLACEHOLDER_QUOTES: { id: string; quote: string; name: string; role: string }[] = [
  {
    id: '1',
    quote: '“Small steps toward calm compound into lasting resilience.”',
    name: 'Dr. A. Chen',
    role: 'Stress medicine',
  },
  {
    id: '2',
    quote: '“Naming your stress is the first move toward easing it.”',
    name: 'Dr. M. Okonkwo',
    role: 'Behavioral health',
  },
  {
    id: '3',
    quote: '“Rest is not a reward; it is part of the work of healing.”',
    name: 'Dr. S. Patel',
    role: 'Sleep & recovery',
  },
];

export function DoctorQuotesSlider() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

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
        data={PLACEHOLDER_QUOTES}
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
          <View style={[styles.card, { width: CARD_WIDTH }]}>
            <Text style={styles.quote}>{item.quote}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.role}>{item.role}</Text>
          </View>
        )}
      />
      <View style={styles.dots}>
        {PLACEHOLDER_QUOTES.map((q, i) => (
          <View key={q.id} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PeacePlotColors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listContent: {
    paddingRight: 16,
    gap: 0,
  },
  card: {
    marginRight: 16,
    backgroundColor: PeacePlotColors.card,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: PeacePlotColors.border,
  },
  quote: {
    fontSize: 16,
    lineHeight: 24,
    color: PeacePlotColors.textBody,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: PeacePlotColors.primaryLight2,
  },
  role: {
    fontSize: 12,
    color: PeacePlotColors.textMuted,
    marginTop: 2,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PeacePlotColors.border,
  },
  dotActive: {
    backgroundColor: PeacePlotColors.primary,
    width: 18,
  },
});
