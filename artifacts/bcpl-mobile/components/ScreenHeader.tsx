import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';

const BALL = require('../assets/images/bcpl-ball.png');
const LOGO_WHITE = require('../assets/images/bcpl-logo-white.png');

/** Shared branded top header for tab screens (tabs have headerShown:false). */
export function ScreenHeader({ title, subtitle, subtitleColor, back }: { title: string; subtitle?: string; subtitleColor?: string, back?: boolean }) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const router = useRouter();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  return (
    <LinearGradient
      colors={['#06030A', '#0B0813', '#161124']}
      locations={[0, 0.4, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.wrap, { paddingTop: topInset + 12 }]}
    >
      <LinearGradient
        colors={['rgba(0,229,255,0.15)', 'transparent']}
        start={{x: 1, y: 0}}
        end={{x: 0, y: 1}}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* decorative ball, bleeding off the right edge */}
      <Image source={BALL} style={styles.bigBall} contentFit="contain" />
      
      <View style={styles.content}>
        <View style={styles.brandRow}>
          {back && (
            <Pressable 
              onPress={() => router.canGoBack() ? router.back() : router.push('/')}
              style={({pressed}) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', opacity: pressed ? 0.7 : 1, flexShrink: 0 })}
            >
              <Feather name="chevron-left" size={20} color="#FFF" />
            </Pressable>
          )}
          <Image source={LOGO_WHITE} style={[styles.logo, back && { maxWidth: 120, height: 36, flexShrink: 1 }]} contentFit="contain" />
          <View style={[styles.seasonPill, { flexShrink: 1, minWidth: 0 }]}>
            <Text style={styles.seasonTxt} numberOfLines={1} adjustsFontSizeToFit>SEASON 5</Text>
          </View>
        </View>
        <Text style={[styles.title, { color: c.ink }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sub, { color: subtitleColor ?? c.sub }, subtitleColor ? { fontFamily: 'BricolageGrotesque_800ExtraBold' } : null]}>
            {subtitle}
          </Text>
        ) : null}
        <LinearGradient
          colors={['#FF1A75', '#00E5FF', 'transparent']}
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
    backgroundColor: 'rgba(0,229,255,0.15)',
    borderColor: 'rgba(0,229,255,0.5)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  seasonTxt: { color: '#00E5FF', fontSize: 10, fontFamily: 'BricolageGrotesque_800ExtraBold', letterSpacing: 1.5 },
  title: { fontSize: 32, fontFamily: 'BricolageGrotesque_800ExtraBold', letterSpacing: -0.5 },
  sub: { fontSize: 15, marginTop: 6, fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.2 },
  underline: { height: 4, borderRadius: 2, width: 80, marginTop: 20, opacity: 0.9 },
});
