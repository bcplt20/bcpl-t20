import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Badge, Card, TeamLogo, getTeamColor, GradientTag } from '@/components/ui';
import type { Match } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';

function fmtDate(iso?: string | null): string {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'TBD';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function MatchCountdown({ scheduledAt }: { scheduledAt?: string | null }) {
  const c = useColors();
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!scheduledAt) return null;
  const diff = new Date(scheduledAt).getTime() - now;
  if (diff <= 0 || diff > 7 * 86400000) return null; // Don't show if > 7 days or past

  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  let text = '';
  if (days > 0) {
    text = `IN ${days}D ${String(remainingHours).padStart(2,'0')}H`;
  } else if (hours > 0) {
    const mins = Math.floor((diff % 3600000) / 60000);
    text = `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;
  } else {
    text = `SOON`;
  }

  return (
    <View style={[styles.countdownPill, { borderColor: c.line, backgroundColor: c.card2 }]}>
      <Text style={[styles.countdownText, { color: c.ink }]}>{text}</Text>
    </View>
  );
}

export function MatchCard({ match }: { match: Match }) {
  const c = useColors();
  const router = useRouter();
  const isLive = match.status === 'live';
  const isDone = match.status === 'completed';

  return (
    <Pressable
      testID={`match-card-${match.id}`}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        router.push(`/match/${match.id}`);
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}
    >
      <Card style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
        <LinearGradient
          colors={[`${getTeamColor(match.team1)}22`, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.4, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <LinearGradient
          colors={[`${getTeamColor(match.team2)}22`, 'transparent']}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 0.6, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={{ padding: 16 }}>
          <View style={styles.topRow}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {!!match.stage && <GradientTag label={match.stage} color={c.cyan} />}
              {!!match.grp && <GradientTag label={`Group ${match.grp}`} color={c.lime} />}
              {!match.stage && !match.grp && <GradientTag label={`Match ${match.matchNo}`} color={c.violet} />}
            </View>
            {isLive ? (
              <GradientTag label="Live" color={c.coral} dot={true} />
            ) : isDone ? (
              <GradientTag label="Result" color={c.sub} />
            ) : (
              <MatchCountdown scheduledAt={match.scheduledAt} />
            )}
          </View>
          <View style={styles.teamsRow}>
            <View style={styles.team}>
              <View style={styles.logoWrap}>
                <TeamLogo name={match.team1} size={64} glow={true} />
              </View>
              <Text style={[styles.teamName, { color: c.ink }]} numberOfLines={2}>
                {match.team1}
              </Text>
            </View>
            
            <View style={styles.vsContainer}>
              <LinearGradient colors={['transparent', c.line, 'transparent']} style={styles.vsLineVert} />
              <View style={[styles.vsChip, { backgroundColor: c.card2, borderColor: c.line }]}>
                <Text style={[styles.vs, { color: c.sub }]}>VS</Text>
              </View>
              <LinearGradient colors={['transparent', c.line, 'transparent']} style={styles.vsLineVert} />
            </View>
  
            <View style={styles.team}>
              <View style={styles.logoWrap}>
                <TeamLogo name={match.team2} size={64} glow={true} />
              </View>
              <Text style={[styles.teamName, { color: c.ink }]} numberOfLines={2}>
                {match.team2}
              </Text>
            </View>
          </View>
          
          <View style={styles.footContainer}>
            <LinearGradient colors={['transparent', c.line, 'transparent']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.footDivider} />
            <Text style={[styles.foot, { color: isDone && match.resultDesc ? c.magenta : c.sub }]} numberOfLines={1}>
              {isDone && match.resultDesc ? match.resultDesc : `${fmtDate(match.scheduledAt)}${match.venue ? ` · ${match.venue}` : ''}`}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16, paddingBottom: 0 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  meta: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.5, textTransform: 'uppercase' },
  countdownPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countdownText: {
    fontSize: 10,
    fontFamily: 'SpaceGrotesk_700Bold',
    letterSpacing: 1,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: { alignItems: 'center', flex: 1, gap: 12 },
  logoWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  teamName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    textAlign: 'center',
    lineHeight: 18,
  },
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
    justifyContent: 'center',
  },
  vsLineVert: {
    height: 1,
    flex: 1,
  },
  vs: { fontSize: 13, fontFamily: 'BricolageGrotesque_800ExtraBold' },
  vsChip: {
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -4,
    borderWidth: 1,
    zIndex: 2,
  },
  footContainer: {
    marginTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  footDivider: {
    height: 1,
    width: '100%',
    marginBottom: 12,
  },
  foot: { fontSize: 13, textAlign: 'center', fontFamily: 'PlusJakartaSans_600SemiBold', letterSpacing: 0.2 },
});
