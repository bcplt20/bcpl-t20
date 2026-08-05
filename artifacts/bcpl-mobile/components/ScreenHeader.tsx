import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';

const BALL = require('../assets/images/bcpl-ball.png');
const LOGO_WHITE = require('../assets/images/bcpl-logo-white.png');

/** Shared branded top header for tab screens (tabs have headerShown:false). */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  return (
    <LinearGradient
      colors={['#0D1E44', '#1B2E52', '#16264A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { paddingTop: topInset + 8 }]}
    >
      {/* decorative ball, bleeding off the right edge */}
      <Image source={BALL} style={styles.bigBall} contentFit="contain" />
      <View style={styles.brandRow}>
        <Image source={LOGO_WHITE} style={styles.logo} contentFit="contain" />
        <View style={styles.seasonPill}>
          <Text style={styles.seasonTxt}>SEASON 5</Text>
        </View>
      </View>
      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sub, { color: c.mutedForeground }]}>{subtitle}</Text> : null}
      <LinearGradient
        colors={['#FF6B00', '#E8B23D', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.underline}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 12, overflow: 'hidden' },
  bigBall: {
    position: 'absolute',
    right: -34,
    top: -6,
    width: 130,
    height: 130,
    opacity: 0.14,
    transform: [{ rotate: '-18deg' }],
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  logo: { width: 148, height: 40 },
  seasonPill: {
    backgroundColor: 'rgba(232,178,61,0.16)',
    borderColor: 'rgba(232,178,61,0.55)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  seasonTxt: { color: '#E8B23D', fontSize: 9.5, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 13, marginTop: 2, fontFamily: 'Inter_400Regular' },
  underline: { height: 3, borderRadius: 3, width: 120, marginTop: 10 },
});
