import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

/** Shared top header for tab screens (tabs have headerShown:false). */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  return (
    <View style={[styles.wrap, { paddingTop: topInset + 10 }]}>
      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sub, { color: c.mutedForeground }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 10 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 13, marginTop: 2, fontFamily: 'Inter_400Regular' },
});
