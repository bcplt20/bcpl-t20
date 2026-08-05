import React from 'react';
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
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
    >
      <Card style={styles.card}>
        {isLive && (
          <LinearGradient
            colors={['rgba(255, 107, 0, 0.15)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            pointerEvents="none"
          />
        )}
        <View style={styles.topRow}>
          <Text style={[styles.meta, { color: c.mutedForeground }]}>
            Match {match.matchNo}
            {match.stage ? ` · ${match.stage}` : ''}
            {match.grp ? ` · Group ${match.grp}` : ''}
          </Text>
          {isLive ? <Badge label="Live" tone="live" /> : isDone ? <Badge label="Result" tone="gold" /> : null}
        </View>
        <View style={styles.teamsRow}>
          <View style={styles.team}>
            <TeamLogo name={match.team1} size={54} />
            <Text style={[styles.teamName, { color: c.foreground }]} numberOfLines={2}>
              {match.team1}
            </Text>
          </View>
          
          <View style={styles.vsContainer}>
            <View style={[styles.vsLine, { backgroundColor: c.border }]} />
            <LinearGradient
              colors={['rgba(232, 178, 61, 0.15)', 'rgba(255, 107, 0, 0.15)']}
              style={styles.vsChip}
            >
              <Text style={[styles.vs, { color: c.accent }]}>VS</Text>
            </LinearGradient>
            <View style={[styles.vsLine, { backgroundColor: c.border }]} />
          </View>

          <View style={styles.team}>
            <TeamLogo name={match.team2} size={54} />
            <Text style={[styles.teamName, { color: c.foreground }]} numberOfLines={2}>
              {match.team2}
            </Text>
          </View>
        </View>
        <Text style={[styles.foot, { color: isDone && match.resultDesc ? c.accent : c.mutedForeground }]} numberOfLines={1}>
          {isDone && match.resultDesc ? match.resultDesc : `${fmtDate(match.scheduledAt)}${match.venue ? ` · ${match.venue}` : ''}`}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  meta: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: { alignItems: 'center', flex: 1, gap: 10 },
  teamName: {
    fontSize: 13.5,
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
  vsLine: {
    height: 1,
    flex: 1,
  },
  vs: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  vsChip: {
    borderWidth: 1,
    borderColor: 'rgba(232,178,61,0.3)',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: '#E8B23D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  foot: { fontSize: 12.5, marginTop: 16, textAlign: 'center', fontFamily: 'Inter_500Medium' },
});
