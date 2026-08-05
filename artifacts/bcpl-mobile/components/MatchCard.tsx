import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Badge, Card, TeamLogo } from '@/components/ui';
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
  if (days > 0) text = `In ${days}d ${remainingHours}h`;
  else if (hours > 0) text = `In ${hours}h`;
  else text = `Starting soon`;

  return (
    <View style={styles.countdownPill}>
      <Text style={styles.countdownText}>{text}</Text>
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
      <Card style={[styles.card, isLive && { borderColor: 'rgba(255,59,48,0.4)', borderWidth: 1 }]}>
        {isLive && (
          <LinearGradient
            colors={['rgba(255, 59, 48, 0.15)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.8 }}
            pointerEvents="none"
          />
        )}
        <View style={styles.topRow}>
          <Text style={[styles.meta, { color: c.mutedForeground }]}>
            Match {match.matchNo}
            {match.stage ? ` · ${match.stage}` : ''}
            {match.grp ? ` · Group ${match.grp}` : ''}
          </Text>
          {isLive ? (
            <Badge label="Live" tone="live" />
          ) : isDone ? (
            <Badge label="Result" tone="gold" />
          ) : (
            <MatchCountdown scheduledAt={match.scheduledAt} />
          )}
        </View>
        <View style={styles.teamsRow}>
          <View style={styles.team}>
            <View style={styles.logoWrap}>
              <LinearGradient colors={['rgba(255,255,255,0.1)', 'transparent']} style={styles.logoGlow} />
              <TeamLogo name={match.team1} size={60} glow={true} />
            </View>
            <Text style={[styles.teamName, { color: c.foreground }]} numberOfLines={2}>
              {match.team1}
            </Text>
          </View>
          
          <View style={styles.vsContainer}>
            <LinearGradient colors={['transparent', c.border, 'transparent']} style={styles.vsLineVert} />
            <LinearGradient
              colors={['#E8B23D', '#FF6B00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vsChip}
            >
              <Text style={styles.vs}>VS</Text>
            </LinearGradient>
            <LinearGradient colors={['transparent', c.border, 'transparent']} style={styles.vsLineVert} />
          </View>

          <View style={styles.team}>
            <View style={styles.logoWrap}>
              <LinearGradient colors={['rgba(255,255,255,0.1)', 'transparent']} style={styles.logoGlow} />
              <TeamLogo name={match.team2} size={60} glow={true} />
            </View>
            <Text style={[styles.teamName, { color: c.foreground }]} numberOfLines={2}>
              {match.team2}
            </Text>
          </View>
        </View>
        
        <View style={styles.footContainer}>
          <LinearGradient colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.footDivider} />
          <Text style={[styles.foot, { color: isDone && match.resultDesc ? c.accent : c.secondaryForeground }]} numberOfLines={1}>
            {isDone && match.resultDesc ? match.resultDesc : `${fmtDate(match.scheduledAt)}${match.venue ? ` · ${match.venue}` : ''}`}
          </Text>
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
  meta: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, textTransform: 'uppercase' },
  countdownPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countdownText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
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
    fontFamily: 'Inter_700Bold',
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
  vs: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  vsChip: {
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -4,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#121F3D',
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
  foot: { fontSize: 13, textAlign: 'center', fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },
});
