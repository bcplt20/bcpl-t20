import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';

const BALL = require('../assets/images/bcpl-ball.png');

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
      {/* decorative glowing ball, bleeding off the right edge */}
      <Image source={BALL} style={styles.bigBall} contentFit="contain" />
      <View style={styles.brandRow}>
        <Image source={BALL} style={styles.smallBall} contentFit="contain" />
        <Text style={styles.brand}>
          BCPL <Text style={{ color: '#FF6B00' }}>T20</Text>
        </Text>
        <View style={styles.seasonPill}>
          <Text style={styles.seasonTxt}>SEASON 4</Text>
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
    opacity: 0.16,
    transform: [{ rotate: '-18deg' }],
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  smallBall: { width: 26, height: 26 },
  brand: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 15, letterSpacing: 1 },
  seasonPill: {
    backgroundColor: 'rgba(232,178,61,0.16)',
    borderColor: 'rgba(232,178,61,0.55)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 2,
    marginLeft: 2,
  },
  seasonTxt: { color: '#E8B23D', fontSize: 9.5, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 13, marginTop: 2, fontFamily: 'Inter_400Regular' },
  underline: { height: 3, borderRadius: 3, width: 120, marginTop: 10 },
});
