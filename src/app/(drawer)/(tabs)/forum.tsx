import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { PeacePlotColors } from '@/constants/peaceplot-theme';

export default function ForumScreen() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Forum</Text>
      <Text style={styles.copy}>
        Articles, chat rooms, chatbot, tree comments, and likes will live here. Use design/xhtml list patterns for
        density.
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
