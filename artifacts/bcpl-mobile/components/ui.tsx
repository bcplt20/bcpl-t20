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

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const c = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderRadius: colors.radius,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.border,
          padding: 14,
        },
        style,
      ]}
    >
      {children}
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
  const bg =
    tone === 'live' ? c.destructive : tone === 'gold' ? c.accent : tone === 'success' ? c.success : c.muted;
  const fg = tone === 'gold' ? c.accentForeground : '#FFFFFF';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
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
      <Feather name="wifi-off" size={30} color={c.mutedForeground} />
      <Text style={{ color: c.mutedForeground, marginTop: 10, textAlign: 'center', paddingHorizontal: 32 }}>
        {message ?? t('Something went wrong — check your internet and try again', 'कुछ गड़बड़ हो गई — इंटरनेट जाँच कर फिर कोशिश करें')}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryBtn,
            { backgroundColor: c.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          testID="retry-button"
        >
          <Text style={{ color: c.primaryForeground, fontFamily: 'Inter_600SemiBold' }}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyView({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  const c = useColors();
  return (
    <View style={styles.center}>
      <Feather name={icon} size={30} color={c.mutedForeground} />
      <Text style={{ color: c.mutedForeground, marginTop: 10, textAlign: 'center', paddingHorizontal: 32 }}>
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
    <Image
      source={{ uri: `${SITE_ASSETS}/bcpl-assets/logos/${teamSlug(name)}.png` }}
      style={{ width: size, height: size }}
      contentFit="contain"
      transition={150}
      onError={() => setFailed(true)}
    />
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
      }}
    >
      <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.6,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  retryBtn: {
    marginTop: 14,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
});
