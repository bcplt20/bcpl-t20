import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';

const BALL = require('../assets/images/bcpl-ball.png');
const LOGO_WHITE = require('../assets/images/bcpl-logo-white.png');

/** Shared branded top header for tab screens (tabs have headerShown:false). */
export function ScreenHeader({ title, subtitle, subtitleColor }: { title: string; subtitle?: string; subtitleColor?: string }) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  return (
    <LinearGradient
      colors={['#0B1736', '#142445', '#1B2E52']}
      locations={[0, 0.4, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.wrap, { paddingTop: topInset + 12 }]}
    >
      {/* decorative ball, bleeding off the right edge */}
      <Image source={BALL} style={styles.bigBall} contentFit="contain" />
      
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <Image source={LOGO_WHITE} style={styles.logo} contentFit="contain" />
          <View style={styles.seasonPill}>
            <Text style={styles.seasonTxt}>SEASON 5</Text>
          </View>
        </View>
        <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sub, { color: subtitleColor ?? c.mutedForeground }, subtitleColor ? { fontFamily: 'Inter_700Bold' } : null]}>
            {subtitle}
          </Text>
        ) : null}
        <LinearGradient
          colors={['#FF6B00', '#E8B23D', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.underline}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', paddingBottom: 16 },
  content: { paddingHorizontal: 20 },
  bigBall: {
    position: 'absolute',
    right: -40,
    top: -10,
    width: 150,
    height: 150,
    opacity: 0.08,
    transform: [{ rotate: '-18deg' }],
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  logo: { width: 140, height: 38 },
  seasonPill: {
    backgroundColor: 'rgba(232,178,61,0.12)',
    borderColor: 'rgba(232,178,61,0.4)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  seasonTxt: { color: '#E8B23D', fontSize: 9.5, fontFamily: 'Inter_700Bold', letterSpacing: 1.2 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  sub: { fontSize: 13.5, marginTop: 4, fontFamily: 'Inter_400Regular' },
  underline: { height: 3, borderRadius: 3, width: 100, marginTop: 14, opacity: 0.9 },
});
