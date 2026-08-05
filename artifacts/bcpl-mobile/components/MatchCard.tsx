import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Badge, Card, TeamLogo } from '@/components/ui';
import type { Match } from '@/lib/api';

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
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card style={styles.card}>
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
            <TeamLogo name={match.team1} size={48} />
            <Text style={[styles.teamName, { color: c.foreground }]} numberOfLines={2}>
              {match.team1}
            </Text>
          </View>
          <View style={[styles.vsChip, { borderColor: c.border }]}>
            <Text style={[styles.vs, { color: c.accent }]}>VS</Text>
          </View>
          <View style={styles.team}>
            <TeamLogo name={match.team2} size={48} />
            <Text style={[styles.teamName, { color: c.foreground }]} numberOfLines={2}>
              {match.team2}
            </Text>
          </View>
        </View>
        <Text style={[styles.foot, { color: c.mutedForeground }]} numberOfLines={1}>
          {isDone && match.resultDesc ? match.resultDesc : `${fmtDate(match.scheduledAt)}${match.venue ? ` · ${match.venue}` : ''}`}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  meta: { fontSize: 11.5, fontFamily: 'Inter_500Medium' },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: { alignItems: 'center', flex: 1, gap: 6 },
  teamName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  vs: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  vsChip: {
    borderWidth: 1,
    borderRadius: 999,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    backgroundColor: 'rgba(232,178,61,0.08)',
  },
  foot: { fontSize: 12, marginTop: 10, textAlign: 'center' },
});
