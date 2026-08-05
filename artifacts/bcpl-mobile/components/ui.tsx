import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { SITE_ASSETS } from '@/lib/api';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <View style={[styles.cardShadow, style]}>
      <LinearGradient
        colors={[c.card, '#0B152A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.cardGradient,
          {
            borderRadius: c.radius,
            borderColor: 'rgba(255,255,255,0.08)',
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.03)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {children}
      </LinearGradient>
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
      <View style={[styles.badgeBase, { backgroundColor: 'rgba(255, 59, 48, 0.15)', borderColor: 'rgba(255, 59, 48, 0.4)', shadowColor: c.destructive, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 2 }]}>
        <Animated.View style={[styles.liveDot, { backgroundColor: c.destructive, opacity: pulse }]} />
        <Text style={[styles.badgeText, { color: '#FF7B7B' }]}>{label.toUpperCase()}</Text>
      </View>
    );
  }

  if (tone === 'gold') {
    return (
      <LinearGradient
        colors={['#E8B23D', '#D49A25']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badgeBase, { borderWidth: 0, shadowColor: '#E8B23D', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 2 }]}
      >
        <Text style={[styles.badgeText, { color: '#0D1E44' }]}>{label.toUpperCase()}</Text>
      </LinearGradient>
    );
  }

  const bg = tone === 'success' ? 'rgba(49, 197, 107, 0.15)' : 'rgba(255,255,255,0.05)';
  const border = tone === 'success' ? 'rgba(49, 197, 107, 0.3)' : 'rgba(255,255,255,0.1)';
  const fg = tone === 'success' ? c.success : c.foreground;

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
      <ActivityIndicator size="large" color={c.primary} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const c = useColors();
  const { t } = useLang();
  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}>
        <Feather name="wifi-off" size={26} color={c.accent} />
      </View>
      <Text style={{ color: c.mutedForeground, marginTop: 14, textAlign: 'center', paddingHorizontal: 40, fontSize: 14, lineHeight: 20 }}>
        {message ?? t('Something went wrong — check your internet and try again', 'कुछ गड़बड़ हो गई — इंटरनेट जाँच कर फिर कोशिश करें')}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryBtn,
            { backgroundColor: 'rgba(255,107,0,0.15)', borderColor: 'rgba(255,107,0,0.4)', opacity: pressed ? 0.8 : 1 },
          ]}
          testID="retry-button"
        >
          <Text style={{ color: c.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Retry</Text>
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
        <Feather name={icon} size={28} color={c.mutedForeground} />
      </View>
      <Text style={{ color: c.mutedForeground, marginTop: 16, textAlign: 'center', paddingHorizontal: 40, fontSize: 14, fontFamily: 'Inter_500Medium' }}>
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

const TEAM_COLORS = ['#FF6B00', '#3B82F6', '#31C56B', '#A855F7', '#E8B23D', '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#0EA5E9'];
export function TeamDot({ name, size = 34, glow = false }: { name: string; size?: number; glow?: boolean }) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const bg = TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
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
      <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
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
    fontFamily: 'Inter_700Bold',
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
