import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { REG_CLOSE_AT } from '@/lib/season';
import { Feather } from '@expo/vector-icons';

function HeaderCountdown() {
  const c = useColors();
  const { t } = useLang();
  const [now, setNow] = React.useState(() => Date.now());
  const pulse = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    ).start();
    return () => clearInterval(id);
  }, []);

  const left = REG_CLOSE_AT - now;
  if (left <= 0) return null;

  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <View style={{
      borderRadius: 8,
      padding: 1,
      shadowColor: '#00E5FF',
      shadowOpacity: 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 0 },
      elevation: 3,
    }}>
      <LinearGradient 
        colors={['#00E5FF', '#FF3DA6']} 
        start={{x: 0, y: 0}} end={{x: 1, y: 1}} 
        style={[StyleSheet.absoluteFill, { borderRadius: 8 }]} 
      />
      <View style={{
        backgroundColor: c.isDark ? '#0B0813' : '#FFF',
        borderRadius: 7,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Animated.View style={{
            width: 4, height: 4, borderRadius: 2, backgroundColor: '#00E5FF', marginRight: 4,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }]
          }} />
          <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {t('Reg Closes In', 'रजिस्ट्रेशन बंद')}
          </Text>
        </View>
        <Text style={{ color: c.cyan, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, fontVariant: ['tabular-nums'] }}>
          {d}d {pad(h)}:{pad(m)}:{pad(s)}
        </Text>
      </View>
    </View>
  );
}
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { SITE_ASSETS } from '@/lib/api';

export function Card({ children, style, padding = 16, border = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padding?: number | string; border?: boolean }) {
  const c = useColors();
  return (
    <View style={[{
      backgroundColor: c.card,
      borderRadius: 22,
      borderWidth: border ? 1 : 0,
      borderColor: border ? c.line : 'transparent',
      padding: padding as any,
    }, style]}>
      {children}
    </View>
  );
}

export function SectionHeader({ title, onSeeAll, seeAllLabel, seeAllTestID }: { title: string; onSeeAll?: () => void; seeAllLabel?: string; seeAllTestID?: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <LinearGradient
          colors={['#5B2BF0', '#9B2FF0', '#FF3DA6']}
          start={{x:0, y:0}} end={{x:0, y:1}}
          style={{ width: 5, height: 24, borderRadius: 3 }}
        />
        <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, color: c.ink, letterSpacing: -0.5 }}>
          {title}
        </Text>
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} testID={seeAllTestID} style={({pressed}) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: c.getAccentText(c.cyan) }}>{seeAllLabel ?? 'See all'}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function GradientTag({ label, color, dot }: { label: string; color: string; dot?: boolean }) {
  const c = useColors();
  const pulse = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (dot) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [dot, pulse]);

  // Map literal colors to gradients roughly based on mockup
  let grads = [color, color];
  if (color === '#FF3DA6') grads = ['#FF3DA6', '#9B2FF0'];
  if (color === '#00DCF5') grads = ['#00DCF5', '#4B6BFF'];
  if (color === '#FFC53D') grads = ['#FFD34D', '#FF7A3D'];
  if (color === '#16E0A3') grads = ['#16E0A3', '#00B8D9'];
  if (color === '#B6FF3C') grads = ['#B6FF3C', '#16E0A3'];
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: c.line, alignSelf: 'flex-start', gap: 6 }}>
      {dot && (
        <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: pulse, shadowColor: color, shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width:0, height:0 } }} />
      )}
      <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>
        <Text style={{ color: c.getAccentText(color) }}>{label}</Text>
      </Text>
    </View>
  );
}

export function Badge({
  label,
  tone = 'muted',
}: {
  label: string;
  tone?: 'live' | 'gold' | 'muted' | 'success';
}) {
  const c = useColors();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (tone === 'live') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [tone, pulse]);
  
  if (tone === 'live') {
    return (
      <View style={[styles.badgeBase, { backgroundColor: 'rgba(255, 59, 48, 0.15)', borderColor: 'rgba(255, 59, 48, 0.4)', shadowColor: c.coral, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 2 }]}>
        <Animated.View style={[styles.liveDot, { backgroundColor: c.coral, opacity: pulse }]} />
        <Text style={[styles.badgeText, { color: '#FF7B7B' }]}>{label.toUpperCase()}</Text>
      </View>
    );
  }

  if (tone === 'gold') {
    return (
      <LinearGradient
        colors={['#00E5FF', '#00B3CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badgeBase, { borderWidth: 0, shadowColor: '#00E5FF', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 2 }]}
      >
        <Text style={[styles.badgeText, { color: '#000000' }]}>{label.toUpperCase()}</Text>
      </LinearGradient>
    );
  }

  const bg = tone === 'success' ? 'rgba(49, 197, 107, 0.15)' : 'rgba(255,255,255,0.05)';
  const border = tone === 'success' ? 'rgba(49, 197, 107, 0.3)' : 'rgba(255,255,255,0.1)';
  const fg = tone === 'success' ? c.mint : c.ink;

  return (
    <View style={[styles.badgeBase, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function LoadingView() {
  const c = useColors();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={c.magenta} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const c = useColors();
  const { t } = useLang();
  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}>
        <Feather name="wifi-off" size={26} color={c.cyan} />
      </View>
      <Text style={{ color: c.sub, marginTop: 14, textAlign: 'center', paddingHorizontal: 40, fontSize: 14, lineHeight: 20 }}>
        {message ?? t('Something went wrong — check your internet and try again', 'कुछ गड़बड़ हो गई — इंटरनेट जाँच कर फिर कोशिश करें')}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryBtn,
            { backgroundColor: 'rgba(255, 26, 117,0.15)', borderColor: 'rgba(255, 26, 117,0.4)', opacity: pressed ? 0.8 : 1 },
          ]}
          testID="retry-button"
        >
          <Text style={{ color: c.magenta, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyView({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  const c = useColors();
  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}>
        <Feather name={icon} size={28} color={c.sub} />
      </View>
      <Text style={{ color: c.sub, marginTop: 16, textAlign: 'center', paddingHorizontal: 40, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>
        {text}
      </Text>
    </View>
  );
}

function teamSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_');
}

export function TeamLogo({ name, size = 44, glow = false }: { name: string; size?: number; glow?: boolean }) {
  const [failed, setFailed] = React.useState(false);
  const c = useColors();
  
  const inner = failed ? (
    <TeamDot name={name} size={size} glow={glow} />
  ) : (
    <View style={[styles.logoContainer, { width: size, height: size, borderRadius: size / 2 }, glow && styles.glow]}>
      <Image
        source={{ uri: `${SITE_ASSETS}/bcpl-assets/logos/${teamSlug(name)}.png` }}
        style={{ width: size * 0.85, height: size * 0.85 }}
        contentFit="contain"
        transition={150}
        onError={() => setFailed(true)}
      />
    </View>
  );

  return inner;
}

const TEAM_COLORS = ['#7C5CFF', '#FF3DA6', '#00DCF5', '#B6FF3C', '#FF8A3D', '#FFC53D', '#16E0A3', '#FF5A6E'];
export function getTeamColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
}

export function TeamDot({ name, size = 34, glow = false }: { name: string; size?: number; glow?: boolean }) {
  const c = useColors();
  if (name.includes('Group') || name.includes('TBD') || name.includes('Winner')) {
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#fff', shadowOpacity: glow ? 0.3 : 0, shadowRadius: glow ? 8 : 0, shadowOffset: { width: 0, height: 0 }, elevation: glow ? 4 : 0 }]}>
        <Image
          source={require('../assets/images/bcpl-ball-clean.png')}
          style={{ width: size * 0.7, height: size * 0.7 }}
          contentFit="contain"
        />
      </View>
    );
  }

  const bg = getTeamColor(name);
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.2)',
        },
        glow && {
          shadowColor: bg,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 10,
          elevation: 4,
        }
      ]}
    >
      <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ScreenBackground = React.memo(() => {
  const c = useColors();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, pointerEvents: 'none' }]}>
      <View style={{ position: 'absolute', top: -100, left: -100, width: 600, height: 600, borderRadius: 300, backgroundColor: c.mesh3 }} />
      <View style={{ position: 'absolute', top: -50, right: -100, width: 500, height: 500, borderRadius: 250, backgroundColor: c.mesh1 }} />
      <View style={{ position: 'absolute', bottom: -100, left: '30%', width: 500, height: 500, borderRadius: 250, backgroundColor: c.mesh2 }} />
    </View>
  );
});

export const APP_BAR_CONTENT_HEIGHT = 64;

export function useAppBarHeight() {
  const insets = useSafeAreaInsets();
  return insets.top + APP_BAR_CONTENT_HEIGHT;
}

export function useBottomNavHeight() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const bottomPadding = isWeb ? 20 : Math.max(20, insets.bottom + 8);
  return bottomPadding + 68 + 24; // 24px extra breathing room
}

export function Season5Lockup() {
  const c = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();
  }, [anim]);

  const spin = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const sweep = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-100%', '200%', '200%']
  });
  
  const pulse = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.4, 0.1]
  });

  return (
    <View style={{
      borderRadius: 12,
      overflow: 'hidden',
      padding: 1.5,
      width: 76,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#00E5FF',
      shadowOpacity: c.isDark ? 0.6 : 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
      elevation: 6,
    }}>
      {/* Rotating gradient background for the conic border effect */}
      <Animated.View style={{
        position: 'absolute',
        width: 150,
        height: 150,
        transform: [{ rotate: spin }],
      }}>
        <LinearGradient 
          colors={['#00E5FF', '#FF3DA6', '#9B2FF0', '#00E5FF']}
          start={{x: 0, y: 0}} end={{x: 1, y: 1}}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Inner pill cut-out */}
      <View style={{
        backgroundColor: c.isDark ? '#0B0813' : '#FFFFFF',
        borderRadius: 10.5,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        {/* Inner glow pulsing */}
        <Animated.View style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: '#00E5FF',
          opacity: pulse,
        }} />
        
        {/* Shimmer sweep */}
        <Animated.View style={{
          position: 'absolute',
          top: 0, bottom: 0, width: 20,
          left: sweep,
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          transform: [{ skewX: '-25deg' }],
          zIndex: 2,
        }} />

        <Text style={{
          fontFamily: 'BricolageGrotesque_800ExtraBold',
          fontSize: 9,
          color: c.isDark ? '#FFF' : '#000',
          letterSpacing: 0.5,
          zIndex: 3,
          backgroundColor: 'transparent'
        }}>
          SEASON 5
        </Text>
      </View>
    </View>
  );
}

import { useRouter } from 'expo-router';

export function GlassAppBar({ title, right, back }: { title?: string, right?: React.ReactNode, back?: boolean }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      paddingTop: insets.top,
      height: insets.top + APP_BAR_CONTENT_HEIGHT,
      paddingHorizontal: 16,
      backgroundColor: c.bg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: c.line,
      zIndex: 100,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {back && (
          <Pressable 
            onPress={() => router.canGoBack() ? router.back() : router.push('/')}
            style={({pressed}) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: c.card2, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: c.line, opacity: pressed ? 0.7 : 1 })}
          >
            <Feather name="chevron-left" size={20} color={c.ink} />
          </Pressable>
        )}
        {title ? (
          <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, color: c.ink, letterSpacing: -0.5 }}>{title}</Text>
        ) : (
          <View style={{ justifyContent: 'center', height: APP_BAR_CONTENT_HEIGHT, paddingTop: 4 }}>
            <Image
              source={c.isDark ? require('../assets/images/bcpl-logo-dark.png') : require('../assets/images/bcpl-logo-light.png')}
              style={{ width: 130, height: 26, alignSelf: 'flex-start' }}
              contentFit="contain"
              contentPosition="left"
            />
            <View style={{ marginTop: 2, marginLeft: 4 }}>
              <Season5Lockup />
            </View>
          </View>
        )}
      </View>
      {right || (!title && <HeaderCountdown />)}
    </View>
  );
}

/**
 * Glass chevron back chip — floats over a hero/header and calls router.back().
 * Used on pushed stack pages (teams, team detail, journey) that have no tab bar.
 */
export function BackChip({ onPress, testID }: { onPress: () => void; testID?: string }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onPress}
      testID={testID ?? 'back-chip'}
      hitSlop={10}
      style={({ pressed }) => ({
        position: 'absolute',
        top: insets.top + 12,
        left: 16,
        zIndex: 200,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: c.glass,
        borderWidth: 1,
        borderColor: c.line,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Feather name="chevron-left" size={22} color={c.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardGradient: {
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  badgeBase: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    marginTop: 18,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderWidth: 1,
  },
  logoContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  }
});
