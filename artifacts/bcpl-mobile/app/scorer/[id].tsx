import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { communityScorecard, communityBall, communityUndo, communityInningsEnd, communityFinish, communityMyMatches } from '@/lib/api';
import { GlassAppBar, ScreenBackground, Card, useAppBarHeight, useBottomNavHeight, ErrorView, LoadingView } from '@/components/ui';

const DISMISSALS = [
  { id: 'bowled', en: 'Bowled', hi: 'बोल्ड' },
  { id: 'caught', en: 'Caught', hi: 'कैच' },
  { id: 'lbw', en: 'LBW', hi: 'LBW' },
  { id: 'run_out', en: 'Run Out', hi: 'रन आउट' },
  { id: 'stumped', en: 'Stumped', hi: 'स्टंप' },
  { id: 'hit_wicket', en: 'Hit Wicket', hi: 'हिट विकेट' },
  { id: 'caught_and_bowled', en: 'C & B', hi: 'कैच एंड बोल्ड' },
  { id: 'retired_hurt', en: 'Retired', hi: 'रिटायर्ड' },
];

export default function ScoringScreen() {
  const { id } = useLocalSearchParams();
  const matchId = id as string;
  const router = useRouter();
  const { token, ready } = useAuth();
  const { t } = useLang();
  const c = useColors();
  const queryClient = useQueryClient();

  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const [batterName, setBatterName] = useState('Batter 1');
  const [bowlerName, setBowlerName] = useState('Bowler 1');
  
  // Modals state
  const [outModal, setOutModal] = useState(false);
  const [extraModal, setExtraModal] = useState<{ type: 'wide' | 'noball' | 'bye' | 'legbye' } | null>(null);
  const [moreModal, setMoreModal] = useState(false);
  
  // Run out details
  const [dismissalType, setDismissalType] = useState('');
  const [runOutRuns, setRunOutRuns] = useState(0);

  const [toastMsg, setToastMsg] = useState('');

  const mineQ = useQuery({
    queryKey: ['community-mine'],
    queryFn: () => communityMyMatches(token as string),
    enabled: !!token,
  });

  const q = useQuery({
    queryKey: ['community-scorecard', matchId],
    queryFn: () => communityScorecard(matchId),
    refetchInterval: 5000,
  });

  const ballMut = useMutation({
    mutationFn: (data: any) => communityBall(token as string, matchId, data),
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['community-scorecard', matchId] });
      setToastMsg(data.commentary);
      setTimeout(() => setToastMsg(''), 3000);
      setOutModal(false);
      setExtraModal(null);
      setMoreModal(false);
    },
    onError: (err: any) => {
      alert(err.message || 'Error scoring ball');
    }
  });

  const undoMut = useMutation({
    mutationFn: () => communityUndo(token as string, matchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-scorecard', matchId] }),
  });

  const inningsEndMut = useMutation({
    mutationFn: () => communityInningsEnd(token as string, matchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-scorecard', matchId] }),
  });

  const finishMut = useMutation({
    mutationFn: (data?: { abandon?: boolean }) => communityFinish(token as string, matchId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-scorecard', matchId] }),
  });

  const handleScore = (type: string, runs: number, extraData?: any) => {
    ballMut.mutate({
      type,
      runs,
      batterName,
      bowlerName,
      ...extraData,
    });
  };

  const isOwner = token ? mineQ.data?.matches.some(m => m.id === matchId) : false;

  if (!ready || q.isLoading || (token && mineQ.isLoading)) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('Scorer', 'स्कोरर')} /><LoadingView /></View>;
  }

  if (q.isError) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('Scorer', 'स्कोरर')} /><ErrorView onRetry={() => q.refetch()} /></View>;
  }

  const match = q.data?.match;
  const innings = q.data?.innings || [];
  
  // API returns innings ascending, so the active one is the last element
  const activeInnings = innings.length > 0 ? innings[innings.length - 1] : undefined;
  
  const isMatchComplete = match?.status === 'completed';
  const showPad = isOwner && activeInnings?.status === 'live';

  const canStartInnings2 = isOwner && (
    (match?.status === 'innings2' && innings.length === 1) ||
    (activeInnings?.status === 'completed' && activeInnings?.inningsNumber === 1)
  );

  const hasSecondInningsBalls = innings.length === 2 && (innings[1].balls > 0 || innings[1].totalRuns > 0 || (innings[1].recentBalls && innings[1].recentBalls.length > 0));
  const canFinishMatch = isOwner && hasSecondInningsBalls && !isMatchComplete;

  const renderPadBtn = (label: string, onPress: () => void, color?: string, outline?: boolean, flex?: number) => (
    <Pressable
      onPress={() => { Haptics.selectionAsync().catch(()=>0); onPress(); }}
      style={({ pressed }) => [
        styles.padBtn,
        { flex: flex || 1, backgroundColor: outline ? 'transparent' : (color || c.card2), borderColor: outline ? color : 'transparent', borderWidth: outline ? 2 : 0 },
        pressed && { opacity: 0.7 }
      ]}
    >
      <Text style={[styles.padBtnText, { color: outline ? color : (color === c.card2 ? c.ink : '#fff') }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('Scorer', 'स्कोरर')} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: bottomNavHeight + 40, paddingTop: appBarHeight }}>
        
        {/* SCORE HEADER */}
        {activeInnings ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
              {activeInnings.battingTeam} {t('Batting', 'बल्लेबाज़ी')}
            </Text>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 48, lineHeight: 56 }}>
              {activeInnings.totalRuns}/{activeInnings.totalWickets}
            </Text>
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20 }}>
              {t('Overs:', 'ओवर्स:')} {activeInnings.overs}.{activeInnings.balls} <Text style={{ color: c.sub }}>/ {match?.oversLimit}</Text>
            </Text>
            {activeInnings.target && (
              <View style={{ marginTop: 8, backgroundColor: `${c.magenta}20`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                <Text style={{ color: c.magenta, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>
                  {t(`Need ${activeInnings.target - activeInnings.totalRuns} more to win`, `जीत के लिए ${activeInnings.target - activeInnings.totalRuns} और चाहिए`)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24 }}>
              {t('Match Not Started', 'मैच शुरू नहीं हुआ')}
            </Text>
          </View>
        )}

        {/* NOT OWNER BANNER */}
        {!isOwner && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Card style={{ backgroundColor: `${c.cyan}20`, borderColor: c.cyan, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: c.cyan, fontFamily: 'PlusJakartaSans_700Bold' }}>
                {t('Live Scorecard Mode', 'लाइव स्कोरकार्ड मोड')}
              </Text>
            </Card>
          </View>
        )}

        {isMatchComplete && match?.resultDesc && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <LinearGradient colors={['#5B2BF0', '#FF3DA6']} start={{x:0,y:0}} end={{x:1,y:1}} style={{ padding: 20, borderRadius: 16, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, textAlign: 'center' }}>
                {match.resultDesc}
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* INNINGS TRANSITION */}
        {canStartInnings2 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Pressable onPress={() => inningsEndMut.mutate()} style={({pressed}) => [{ opacity: pressed ? 0.8 : 1 }]}>
              <LinearGradient colors={['#00DCF5', '#5B2BF0']} style={{ padding: 16, borderRadius: 16, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>
                  {inningsEndMut.isPending ? t('Starting...', 'शुरू कर रहे हैं...') : t('Start 2nd innings', 'दूसरी innings शुरू करें')}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* INPUT CHIPS */}
        {showPad && (
          <View style={{ paddingHorizontal: 16, flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 4 }}>
                {t('Batter', 'बल्लेबाज़')}
              </Text>
              <TextInput
                value={batterName}
                onChangeText={setBatterName}
                style={[styles.inputChip, { backgroundColor: c.card, color: c.ink, borderColor: c.line }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 4 }}>
                {t('Bowler', 'गेंदबाज़')}
              </Text>
              <TextInput
                value={bowlerName}
                onChangeText={setBowlerName}
                style={[styles.inputChip, { backgroundColor: c.card, color: c.ink, borderColor: c.line }]}
              />
            </View>
          </View>
        )}

        {/* GIANT PAD */}
        {showPad && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            {toastMsg ? (
              <Text style={{ color: c.cyan, fontFamily: 'PlusJakartaSans_600SemiBold', textAlign: 'center', marginBottom: 8 }}>
                {toastMsg}
              </Text>
            ) : null}
            <View style={{ gap: 12 }}>
              <View style={styles.padRow}>
                {renderPadBtn('0', () => handleScore('run', 0), c.card2)}
                {renderPadBtn('1', () => handleScore('run', 1), c.card2)}
                {renderPadBtn('2', () => handleScore('run', 2), c.card2)}
              </View>
              <View style={styles.padRow}>
                {renderPadBtn('3', () => handleScore('run', 3), c.card2)}
                {renderPadBtn('4', () => handleScore('run', 4), '#31C56B')}
                {renderPadBtn('6', () => handleScore('run', 6), '#7C5CFF')}
              </View>
              <View style={styles.padRow}>
                {renderPadBtn('WD', () => setExtraModal({ type: 'wide' }), '#FFC53D')}
                {renderPadBtn('NB', () => setExtraModal({ type: 'noball' }), '#FF8A3D')}
                {renderPadBtn('BYE', () => setExtraModal({ type: 'bye' }), c.card2)}
              </View>
              <View style={styles.padRow}>
                {renderPadBtn('OUT', () => setOutModal(true), '#FF1A75')}
                {renderPadBtn('UNDO', () => undoMut.mutate(), c.sub, true)}
                {renderPadBtn('⋯', () => setMoreModal(true), c.card2)}
              </View>
            </View>
          </View>
        )}

        {/* FINISH / ABANDON OPTIONS (BELOW PAD) */}
        {isOwner && !isMatchComplete && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16, gap: 12 }}>
            {canFinishMatch && (
              <Pressable onPress={() => finishMut.mutate({})} style={({pressed}) => [{ opacity: pressed ? 0.8 : 1 }]}>
                <LinearGradient colors={['#FF3DA6', '#FF1A75']} style={{ padding: 16, borderRadius: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>
                    {finishMut.isPending ? t('Finishing...', 'ख़त्म कर रहे हैं...') : t('Finish Match', 'Match ख़त्म करें')}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
            <Pressable onPress={() => finishMut.mutate({ abandon: true })} style={({pressed}) => [{ opacity: pressed ? 0.8 : 1, backgroundColor: c.card2, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: c.line }]}>
              <Text style={{ color: c.coral, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>
                {t('Abandon Match', 'मैच रद्द करें')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* SCORECARD SECTION */}
        {innings.map((inn) => (
          <View key={inn.inningsNumber} style={{ marginTop: 24 }}>
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18 }}>
                {t('Innings', 'पारी')} {inn.inningsNumber} - {inn.battingTeam}
              </Text>
            </View>
            
            {/* Recent balls */}
            {inn.recentBalls?.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 16 }}>
                {inn.recentBalls.slice().reverse().map((b, i) => {
                  let color = c.card2;
                  let textColor = c.ink;
                  let label = b.runs.toString();
                  if (b.isWicket) { color = '#FF1A75'; textColor = '#fff'; label = 'W'; }
                  else if (b.runs === 4) { color = '#31C56B'; textColor = '#fff'; }
                  else if (b.runs === 6) { color = '#7C5CFF'; textColor = '#fff'; }
                  else if (b.extraType) { color = '#FFC53D'; textColor = '#000'; label = b.extraType === 'wide' ? 'wd' : 'nb'; }
                  
                  return (
                    <View key={i} style={[styles.ballCircle, { backgroundColor: color }]}>
                      <Text style={{ color: textColor, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 }}>{label}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Batting Table */}
            <Card style={{ marginHorizontal: 16, padding: 0, overflow: 'hidden', marginBottom: 16 }}>
              <View style={[styles.tableRow, { backgroundColor: c.card2 }]}>
                <Text style={[styles.tableCell, { flex: 3, color: c.sub, fontFamily: 'PlusJakartaSans_700Bold' }]}>{t('Batter', 'बल्लेबाज़')}</Text>
                <Text style={[styles.tableCell, { color: c.sub, fontFamily: 'PlusJakartaSans_700Bold' }]}>{t('R', 'R')}</Text>
                <Text style={[styles.tableCell, { color: c.sub, fontFamily: 'PlusJakartaSans_700Bold' }]}>{t('B', 'B')}</Text>
                <Text style={[styles.tableCell, { color: c.sub, fontFamily: 'PlusJakartaSans_700Bold' }]}>{t('4s', '4s')}</Text>
                <Text style={[styles.tableCell, { color: c.sub, fontFamily: 'PlusJakartaSans_700Bold' }]}>{t('6s', '6s')}</Text>
              </View>
              {inn.batting?.map((b, i) => (
                <View key={i} style={[styles.tableRow, { borderTopWidth: 1, borderTopColor: c.line }]}>
                  <Text style={[styles.tableCell, { flex: 3, color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }]} numberOfLines={1}>
                    {b.name} {b.out ? <Text style={{ color: '#FF1A75', fontSize: 10 }}>{t('(out)', '(आउट)')}</Text> : '*'}
                  </Text>
                  <Text style={[styles.tableCell, { color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>{b.runs}</Text>
                  <Text style={[styles.tableCell, { color: c.sub }]}>{b.balls}</Text>
                  <Text style={[styles.tableCell, { color: c.sub }]}>{b.fours}</Text>
                  <Text style={[styles.tableCell, { color: c.sub }]}>{b.sixes}</Text>
                </View>
              ))}
            </Card>

            {/* Bowling Table */}
            <Card style={{ marginHorizontal: 16, padding: 0, overflow: 'hidden' }}>
              <View style={[styles.tableRow, { backgroundColor: c.card2 }]}>
                <Text style={[styles.tableCell, { flex: 3, color: c.sub, fontFamily: 'PlusJakartaSans_700Bold' }]}>{t('Bowler', 'गेंदबाज़')}</Text>
                <Text style={[styles.tableCell, { color: c.sub, fontFamily: 'PlusJakartaSans_700Bold' }]}>{t('O', 'O')}</Text>
                <Text style={[styles.tableCell, { color: c.sub, fontFamily: 'PlusJakartaSans_700Bold' }]}>{t('R', 'R')}</Text>
                <Text style={[styles.tableCell, { color: c.sub, fontFamily: 'PlusJakartaSans_700Bold' }]}>{t('W', 'W')}</Text>
              </View>
              {inn.bowling?.map((b, i) => (
                <View key={i} style={[styles.tableRow, { borderTopWidth: 1, borderTopColor: c.line }]}>
                  <Text style={[styles.tableCell, { flex: 3, color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }]} numberOfLines={1}>
                    {b.name}
                  </Text>
                  <Text style={[styles.tableCell, { color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
                    {b.overs}
                  </Text>
                  <Text style={[styles.tableCell, { color: c.sub }]}>{b.runs}</Text>
                  <Text style={[styles.tableCell, { color: '#FF1A75', fontFamily: 'PlusJakartaSans_700Bold' }]}>{b.wickets}</Text>
                </View>
              ))}
            </Card>
          </View>
        ))}

      </ScrollView>

      {/* OUT MODAL */}
      <Modal visible={outModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: c.bg, borderColor: c.line, borderWidth: 1 }]}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 16 }}>
              {t('How out?', 'कैसे आउट?')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {DISMISSALS.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => setDismissalType(d.id)}
                  style={[styles.chip, { backgroundColor: dismissalType === d.id ? '#FF1A75' : c.card2 }]}
                >
                  <Text style={{ color: dismissalType === d.id ? '#fff' : c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    {t(d.en, d.hi)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {dismissalType === 'run_out' && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 8 }}>
                  {t('Runs completed (runs ran before out):', 'पूरे किए गए रन (आउट होने से पहले):')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[0, 1, 2, 3].map(r => (
                    <Pressable
                      key={r}
                      onPress={() => setRunOutRuns(r)}
                      style={[styles.chip, { backgroundColor: runOutRuns === r ? c.cyan : c.card2, flex: 1, alignItems: 'center' }]}
                    >
                      <Text style={{ color: runOutRuns === r ? c.bg : c.ink, fontFamily: 'PlusJakartaSans_700Bold' }}>{r}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => { setOutModal(false); setDismissalType(''); }} style={[styles.modalBtn, { backgroundColor: c.card2 }]}>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Cancel', 'रद्द करें')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!dismissalType) return;
                  handleScore('wicket', dismissalType === 'run_out' ? runOutRuns : 0, { dismissalType });
                }}
                style={[styles.modalBtn, { backgroundColor: '#FF1A75', opacity: dismissalType ? 1 : 0.5 }]}
              >
                <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' }}>{t('OUT!', 'आउट!')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* EXTRA MODAL */}
      <Modal visible={!!extraModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: c.bg, borderColor: c.line, borderWidth: 1 }]}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 8 }}>
              {extraModal?.type === 'wide' ? 'WIDE' : extraModal?.type === 'noball' ? 'NO BALL' : extraModal?.type === 'bye' ? 'BYE' : 'LEG BYE'}
            </Text>
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 16 }}>
              {t('Extra runs ran? (Tap to send)', 'कितने अतिरिक्त रन दौड़े? (भेजने के लिए दबाएं)')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {[0, 1, 2, 3, 4].map(r => (
                <Pressable
                  key={r}
                  onPress={() => { handleScore(extraModal!.type, r); }}
                  style={[styles.padBtn, { width: 64, height: 64, backgroundColor: c.card2 }]}
                >
                  <Text style={[styles.padBtnText, { color: c.ink }]}>+{r}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setExtraModal(null)} style={{ marginTop: 24, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Cancel', 'रद्द करें')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MORE MODAL (Leg Bye, 5 runs) */}
      <Modal visible={moreModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: c.bg, borderColor: c.line, borderWidth: 1 }]}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 16 }}>
              {t('More Options', 'अन्य विकल्प')}
            </Text>
            <View style={{ gap: 12 }}>
              <Pressable onPress={() => { setMoreModal(false); setExtraModal({ type: 'legbye' }); }} style={[styles.padBtn, { height: 56, backgroundColor: c.card2 }]}>
                <Text style={[styles.padBtnText, { color: c.ink, fontSize: 18 }]}>{t('Leg Bye', 'लेग बाय')}</Text>
              </Pressable>
              <Pressable onPress={() => { setMoreModal(false); handleScore('run', 5); }} style={[styles.padBtn, { height: 56, backgroundColor: c.card2 }]}>
                <Text style={[styles.padBtnText, { color: c.ink, fontSize: 18 }]}>{t('5 Runs', '5 रन')}</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setMoreModal(false)} style={{ marginTop: 24, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Cancel', 'रद्द करें')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {ballMut.isPending && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={c.cyan} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputChip: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    textAlign: 'center',
  },
  padRow: {
    flexDirection: 'row',
    gap: 12,
  },
  padBtn: {
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  padBtnText: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 22,
  },
  ballCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    padding: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  }
});
