import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { PeacePlotColors } from '@/constants/peaceplot-theme';

export default function DiscoverScreen() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Discover</Text>
      <Text style={styles.copy}>
        Books, video, audio stories, yoga, tai chi, AI advice, and places will be listed here per the plan. Connect
        content to Supabase when the library schema is ready.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: PeacePlotColors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: PeacePlotColors.text,
    marginBottom: 12,
  },
  copy: {
    fontSize: 15,
    lineHeight: 22,
    color: PeacePlotColors.textBody,
  },
});
