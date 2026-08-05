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
      colors={['#050914', '#0A1128', '#121F3D']}
      locations={[0, 0.4, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.wrap, { paddingTop: topInset + 12 }]}
    >
      <LinearGradient
        colors={['rgba(255,107,0,0.15)', 'transparent']}
        start={{x: 1, y: 0}}
        end={{x: 0, y: 1}}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
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
          <Text style={[styles.sub, { color: subtitleColor ?? c.mutedForeground }, subtitleColor ? { fontFamily: 'Inter_800ExtraBold' } : null]}>
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
  wrap: { overflow: 'hidden', paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  content: { paddingHorizontal: 20 },
  bigBall: {
    position: 'absolute',
    right: -40,
    top: -20,
    width: 180,
    height: 180,
    opacity: 0.15,
    transform: [{ rotate: '-18deg' }],
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  logo: { width: 150, height: 42 },
  seasonPill: {
    backgroundColor: 'rgba(232,178,61,0.15)',
    borderColor: 'rgba(232,178,61,0.5)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  seasonTxt: { color: '#E8B23D', fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1.5 },
  title: { fontSize: 32, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
  sub: { fontSize: 15, marginTop: 6, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },
  underline: { height: 4, borderRadius: 2, width: 80, marginTop: 20, opacity: 0.9 },
});
