import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const c = useColors();
  return (
    <View style={[styles.cardShadow, style]}>
      <LinearGradient
        colors={[c.card, '#1E325F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.cardGradient,
          {
            borderRadius: colors.radius,
            borderColor: 'rgba(255,255,255,0.1)',
          },
        ]}
      >
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
  
  if (tone === 'live') {
    return (
      <View style={[styles.badgeBase, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
        <View style={[styles.liveDot, { backgroundColor: c.destructive }]} />
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
        style={[styles.badgeBase, { borderWidth: 0 }]}
      >
        <Text style={[styles.badgeText, { color: '#0D1E44' }]}>{label.toUpperCase()}</Text>
      </LinearGradient>
    );
  }

  const bg = tone === 'success' ? 'rgba(49, 197, 107, 0.15)' : 'rgba(31, 50, 96, 0.6)';
  const border = tone === 'success' ? 'rgba(49, 197, 107, 0.3)' : 'rgba(255,255,255,0.1)';
  const fg = tone === 'success' ? c.success : c.mutedForeground;

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

/** Real team logo from the League site, with monogram fallback while loading/on error. */
import { Image } from 'expo-image';
import { SITE_ASSETS } from '@/lib/api';

function teamSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_');
}

export function TeamLogo({ name, size = 44 }: { name: string; size?: number }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) return <TeamDot name={name} size={size} />;
  return (
    <View style={[styles.logoContainer, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={{ uri: `${SITE_ASSETS}/bcpl-assets/logos/${teamSlug(name)}.png` }}
        style={{ width: size * 0.85, height: size * 0.85 }}
        contentFit="contain"
        transition={150}
        onError={() => setFailed(true)}
      />
    </View>
  );
}

/** Round team monogram from the team name, colored deterministically. */
const TEAM_COLORS = ['#FF6B00', '#3B82F6', '#31C56B', '#A855F7', '#E8B23D', '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#0EA5E9'];
export function TeamDot({ name, size = 34 }: { name: string; size?: number }) {
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
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
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
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
