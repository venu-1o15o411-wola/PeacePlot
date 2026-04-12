import { DrawerActions } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useNavigation } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { PeacePlotColors } from '@/constants/peaceplot-theme';

type AppHeaderProps = {
  /** Optional: open chat (Forum / messaging) */
  onChatPress?: () => void;
  /** Optional: notifications list */
  onNotifyPress?: () => void;
};

export function AppHeader({ onChatPress, onNotifyPress }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <Image
        source={require('@/assets/images/peaceplot.png')}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="PeacePlot"
      />
      <View style={styles.actions}>
        <Pressable
          onPress={onChatPress}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Chat">
          <Ionicons name="chatbubble-outline" size={24} color={PeacePlotColors.text} />
        </Pressable>
        <Pressable
          onPress={onNotifyPress}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={24} color={PeacePlotColors.text} />
        </Pressable>
        <Pressable
          onPress={openDrawer}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Open menu">
          <Ionicons name="grid-outline" size={24} color={PeacePlotColors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: PeacePlotColors.headerGlass,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PeacePlotColors.border,
  },
  logo: {
    width: 140,
    height: 40,
    maxWidth: '55%',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 8,
  },
});
