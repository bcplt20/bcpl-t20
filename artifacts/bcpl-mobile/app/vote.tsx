import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Animated } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getPolls, votePoll, type Poll, type PollOption, ApiError } from '@/lib/api';
import { ScreenBackground, GlassAppBar, Card, useAppBarHeight, useBottomNavHeight, LoadingView, ErrorView } from '@/components/ui';
import { useDeviceId } from '@/hooks/useDeviceId';

function PollOptionRow({ opt, poll, handleVote, voteMut, showResults }: any) {
  const c = useColors();
  const anim = useRef(new Animated.Value(0)).current;
  const isVoted = poll.votedOptionId === opt.id;
  const pct = showResults ? (opt.percent || 0) : 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <Pressable
      onPress={() => handleVote(opt.id)}
      disabled={!poll.votingOpen || !!poll.hasVoted || voteMut.isPending}
      style={({ pressed }) => [
        styles.optionBtn,
        {
          backgroundColor: c.card,
          borderColor: isVoted ? c.cyan : c.line,
          borderWidth: isVoted ? 2 : 1,
          transform: [{ scale: pressed && poll.votingOpen && !poll.hasVoted ? 0.98 : 1 }]
        }
      ]}
    >
      {showResults && (
        <Animated.View 
          style={[
            StyleSheet.absoluteFill, 
            { 
              backgroundColor: isVoted ? `${c.cyan}20` : `${c.violet}10`, 
              width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), 
              opacity: 0.8 
            }
          ]} 
        />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, flex: 1, zIndex: 2 }}>
        {opt.imageUrl && (
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card2, marginRight: 12, overflow: 'hidden', borderWidth: 1, borderColor: c.line }}>
            <Image source={{ uri: opt.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, marginBottom: 2 }}>
            {opt.label}
          </Text>
          {opt.teamName && (
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 }}>
              {opt.teamName}
            </Text>
          )}
        </View>
        {showResults ? (
          <Text style={{ color: isVoted ? c.cyan : c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>
            {Math.round(pct)}%
          </Text>
        ) : voteMut.variables === opt.id && voteMut.isPending ? (
          <ActivityIndicator color={c.cyan} size="small" />
        ) : (
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: c.line }} />
        )}
      </View>
    </Pressable>
  );
}

function PollCard({ poll, deviceId }: { poll: Poll, deviceId: string | null }) {
  const c = useColors();
  const { t } = useLang();
  const { token } = useAuth();
  const qc = useQueryClient();

  const [votingFor, setVotingFor] = useState<string | null>(null);

  const voteMut = useMutation({
    mutationFn: (optionId: string) => {
      if (!deviceId) throw new Error('wait_device');
      return votePoll(poll.id, optionId, deviceId, token).then(res => ({ ...res, optionId }));
    },
    onSuccess: (data) => {
      qc.setQueryData(['polls', token], (old: any) => {
        if (!old) return old;
        return {
          polls: old.polls.map((p: Poll) => 
            p.id === poll.id 
              ? { ...p, hasVoted: true, votedOptionId: data.optionId, totalVotes: data.totalVotes, options: data.options } 
              : p
          )
        };
      });
    },
    onError: (err: any) => {
      if (err instanceof ApiError && err.status === 409) {
        Alert.alert(t('Already Voted', 'आप vote कर चुके हैं'), t('You have already voted in this poll.', 'आप इस पोल में पहले ही वोट कर चुके हैं।'));
        qc.invalidateQueries({ queryKey: ['polls', token] });
      } else if (err instanceof ApiError && err.status === 429) {
        Alert.alert(t('Too Many Requests', 'बहुत अधिक प्रयास'), t('You are voting too fast. Please try again later.', 'आप बहुत तेज़ी से वोट कर रहे हैं। कृपया बाद में प्रयास करें।'));
      } else if (err.message !== 'wait_device') {
        Alert.alert(t('Error', 'त्रुटि'), err.message || t('Could not cast vote.', 'वोट नहीं डाला जा सका।'));
      }
    },
    onSettled: () => setVotingFor(null),
  });

  const handleVote = (optionId: string) => {
    if (!poll.votingOpen || poll.hasVoted || voteMut.isPending || !deviceId) return;
    setVotingFor(optionId);
    voteMut.mutate(optionId);
  };

  const showResults = !poll.votingOpen || (poll.hasVoted && poll.showLiveResults);

  return (
    <Card padding={0} style={{ overflow: 'hidden', marginBottom: 16 }}>
      <LinearGradient colors={[`${c.violet}15`, 'transparent']} style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.card2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: c.line }}>
            <Feather name={poll.category === 'mvp' ? 'star' : 'bar-chart-2'} size={12} color={c.cyan} />
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {poll.category}
            </Text>
          </View>
          {!poll.votingOpen ? (
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {t('Closed', 'बंद हो गया')}
            </Text>
          ) : poll.hasVoted ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="check-circle" size={12} color={c.lime} />
              <Text style={{ color: c.lime, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {t('Voted', 'वोट किया')}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 16 }}>
          {t(poll.titleEn, poll.titleHi)}
        </Text>

        <View style={{ gap: 10 }}>
          {poll.options.map((opt) => (
            <PollOptionRow key={opt.id} opt={opt} poll={poll} handleVote={handleVote} voteMut={voteMut} showResults={showResults} />
          ))}
        </View>

        {showResults && poll.totalVotes > 0 && (
          <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, marginTop: 16, textAlign: 'center' }}>
            {poll.totalVotes.toLocaleString()} {t('total votes', 'कुल वोट')}
          </Text>
        )}
      </LinearGradient>
    </Card>
  );
}

export default function VoteScreen() {
  const c = useColors();
  const { t } = useLang();
  const { token, ready } = useAuth();
  const deviceId = useDeviceId();
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const q = useQuery({
    queryKey: ['polls', token],
    queryFn: () => getPolls(token as string | undefined),
    enabled: ready,
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('Fan Voting', 'फैन वोटिंग')} back={true} />
      
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: appBarHeight + 16, paddingBottom: bottomNavHeight + 40 }}>
        {q.isLoading ? (
          <LoadingView />
        ) : q.isError ? (
          <ErrorView onRetry={() => q.refetch()} />
        ) : q.data?.polls.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center', marginTop: 40 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0, 220, 245, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0, 220, 245, 0.2)' }}>
              <Feather name="bar-chart-2" size={36} color="#00DCF5" />
            </View>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, textAlign: 'center', marginBottom: 12 }}>
              {t('Voting Starts Soon', 'Voting जल्द शुरू होगा')}
            </Text>
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
              {t('Fan polls will appear here during the live matches. Support your favorite players!', 'लाइव मैचों के दौरान फैन पोल्स यहाँ दिखाई देंगे। अपने पसंदीदा खिलाड़ियों को सपोर्ट करें!')}
            </Text>
          </View>
        ) : (
          <View>
            <Text style={{ color: c.sub, fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>
              {t('HAVE YOUR SAY', 'अपनी राय दें')}
            </Text>
            {q.data?.polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} deviceId={deviceId} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  optionBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  }
});
