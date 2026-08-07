import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { communityCreateMatch } from '@/lib/api';
import { GlassAppBar, ScreenBackground, Card, useAppBarHeight, useBottomNavHeight, LoadingView } from '@/components/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const OVERS_PRESETS = [5, 8, 10, 12, 15, 20];

export default function NewMatchScreen() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const { t } = useLang();
  const c = useColors();
  const queryClient = useQueryClient();
  
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [venue, setVenue] = useState('');
  const [oversLimit, setOversLimit] = useState(10);
  const [customOvers, setCustomOvers] = useState('');
  const [battingFirst, setBattingFirst] = useState<'team1' | 'team2'>('team1');
  const [errorMsg, setErrorMsg] = useState('');

  const createMut = useMutation({
    mutationFn: (data: any) => communityCreateMatch(token as string, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['community-mine'] });
      router.replace(`/scorer/${data.match.id}?owned=1`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Error creating match');
    },
  });

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('New Match', 'नया मैच')} /><LoadingView /></View>;
  }

  if (!token) {
    router.replace('/scorer');
    return null;
  }

  const handleStart = () => {
    setErrorMsg('');
    if (!team1.trim() || !team2.trim()) {
      setErrorMsg(t('Enter both team names', 'दोनों टीमों के नाम दर्ज करें'));
      return;
    }
    const finalOvers = customOvers ? parseInt(customOvers, 10) : oversLimit;
    if (!finalOvers || finalOvers < 1 || finalOvers > 50) {
      setErrorMsg(t('Overs must be between 1 and 50', 'ओवर्स 1 से 50 के बीच होने चाहिए'));
      return;
    }

    createMut.mutate({
      team1: team1.trim(),
      team2: team2.trim(),
      venue: venue.trim() || undefined,
      oversLimit: finalOvers,
      battingFirst,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('New Match', 'नया मैच')} />
      <ScrollView contentContainerStyle={{ paddingBottom: bottomNavHeight + 100, paddingTop: appBarHeight }}>
        <View style={{ padding: 16, gap: 24 }}>
          
          {/* Teams */}
          <Card padding={20} style={{ gap: 16 }}>
            <View>
              <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
                {t('Team A Name', 'Team A नाम')}
              </Text>
              <TextInput
                value={team1}
                onChangeText={setTeam1}
                placeholder={t('e.g. Blue Stars', 'जैसे Blue Stars')}
                placeholderTextColor={c.sub}
                style={[styles.input, { backgroundColor: c.card2, color: c.ink, borderColor: c.line }]}
              />
            </View>
            <View>
              <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
                {t('Team B Name', 'Team B नाम')}
              </Text>
              <TextInput
                value={team2}
                onChangeText={setTeam2}
                placeholder={t('e.g. Red Stars', 'जैसे Red Stars')}
                placeholderTextColor={c.sub}
                style={[styles.input, { backgroundColor: c.card2, color: c.ink, borderColor: c.line }]}
              />
            </View>
          </Card>

          {/* Batting First */}
          <Card padding={20}>
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, marginBottom: 12 }}>
              {t('Who bats first?', 'पहले batting कौन?')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => setBattingFirst('team1')}
                style={[{ flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, alignItems: 'center' }, battingFirst === 'team1' ? { borderColor: c.magenta, backgroundColor: `${c.magenta}10` } : { borderColor: c.line, backgroundColor: c.card2 }]}
              >
                <Text style={{ color: battingFirst === 'team1' ? c.magenta : c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }} numberOfLines={1}>
                  {team1 || 'Team A'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setBattingFirst('team2')}
                style={[{ flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, alignItems: 'center' }, battingFirst === 'team2' ? { borderColor: c.violet, backgroundColor: `${c.violet}10` } : { borderColor: c.line, backgroundColor: c.card2 }]}
              >
                <Text style={{ color: battingFirst === 'team2' ? c.violet : c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }} numberOfLines={1}>
                  {team2 || 'Team B'}
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Overs */}
          <Card padding={20}>
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, marginBottom: 12 }}>
              {t('Overs Limit', 'ओवर्स')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              {OVERS_PRESETS.map((o) => (
                <Pressable
                  key={o}
                  onPress={() => { setOversLimit(o); setCustomOvers(''); }}
                  style={[{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 }, oversLimit === o && !customOvers ? { borderColor: c.cyan, backgroundColor: `${c.cyan}20` } : { borderColor: c.line, backgroundColor: c.card2 }]}
                >
                  <Text style={{ color: oversLimit === o && !customOvers ? c.ink : c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>
                    {o}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={customOvers}
              onChangeText={setCustomOvers}
              keyboardType="number-pad"
              placeholder={t('Custom (e.g. 10)', 'कस्टम (जैसे 10)')}
              placeholderTextColor={c.sub}
              style={[styles.input, { backgroundColor: c.card2, color: c.ink, borderColor: c.line }]}
            />
          </Card>

          {/* Venue (Optional) */}
          <Card padding={20}>
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
              {t('Ground/Venue (Optional)', 'मैदान का नाम (वैकल्पिक)')}
            </Text>
            <TextInput
              value={venue}
              onChangeText={setVenue}
              placeholder={t('e.g. Shivaji Park', 'जैसे शिवाजी पार्क')}
              placeholderTextColor={c.sub}
              style={[styles.input, { backgroundColor: c.card2, color: c.ink, borderColor: c.line }]}
            />
          </Card>

          {errorMsg ? (
            <Text style={{ color: c.coral, fontFamily: 'PlusJakartaSans_600SemiBold', textAlign: 'center' }}>
              {errorMsg}
            </Text>
          ) : null}

          <Pressable
            onPress={handleStart}
            disabled={createMut.isPending}
            style={({ pressed }) => [{ borderRadius: 16, overflow: 'hidden', opacity: pressed || createMut.isPending ? 0.8 : 1 }]}
          >
            <LinearGradient colors={['#00DCF5', '#5B2BF0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20 }}>
                {createMut.isPending ? t('Starting...', 'शुरू कर रहे हैं...') : t('Match शुरू करें', 'Start Match')}
              </Text>
            </LinearGradient>
          </Pressable>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
  },
});
