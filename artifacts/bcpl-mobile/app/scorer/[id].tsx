import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { communityScorecard, communityBall, communityUndo, communityInningsEnd, communityFinish, communityMyMatches, communityGetOfficials, communityAddOfficial, communityRemoveOfficial, communityVerifyTeamStart, communityVerifyTeamConfirm } from '@/lib/api';
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
  const { token, ready, user } = useAuth();
  const { t } = useLang();
  const c = useColors();
  const queryClient = useQueryClient();

  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  // State: Players on strike
  const [striker, setStriker] = useState('Batter 1');
  const [strikerId, setStrikerId] = useState<string | undefined>(undefined);
  const [nonStriker, setNonStriker] = useState('Batter 2');
  const [nonStrikerId, setNonStrikerId] = useState<string | undefined>(undefined);
  const [bowler, setBowler] = useState('Bowler 1');
  const [bowlerId, setBowlerId] = useState<string | undefined>(undefined);
  
  // Modals state
  const [outModal, setOutModal] = useState(false);
  const [extraModal, setExtraModal] = useState<{ type: 'wide' | 'noball' | 'bye' | 'legbye' } | null>(null);
  const [moreModal, setMoreModal] = useState(false);
  
  // Prompt Modals
  const [newBowlerModal, setNewBowlerModal] = useState(false);
  const [newBowlerName, setNewBowlerName] = useState('');
  const [newBowlerId, setNewBowlerId] = useState<string | undefined>(undefined);
  const [newBatterTarget, setNewBatterTarget] = useState<'striker' | 'nonStriker' | null>(null);
  const [newBatterName, setNewBatterName] = useState('');
  const [newBatterId, setNewBatterId] = useState<string | undefined>(undefined);
  const [renameTarget, setRenameTarget] = useState<'striker' | 'nonStriker' | 'bowler' | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameMemberId, setRenameMemberId] = useState<string | undefined>(undefined);

  // Setup UI State
  const [setupInnings, setSetupInnings] = useState(0);
  const [setupS, setSetupS] = useState('Batter 1');
  const [setupSId, setSetupSId] = useState<string | undefined>(undefined);
  const [setupNs, setSetupNs] = useState('Batter 2');
  const [setupNsId, setSetupNsId] = useState<string | undefined>(undefined);
  const [setupB, setSetupB] = useState('Bowler 1');
  const [setupBId, setSetupBId] = useState<string | undefined>(undefined);

  // Run out details
  const [dismissalType, setDismissalType] = useState('');
  const [runOutRuns, setRunOutRuns] = useState(0);

  const [toastMsg, setToastMsg] = useState('');
  
  const [queuedBowlerPrompt, setQueuedBowlerPrompt] = useState(false);
  const historyRef = React.useRef<{ striker: string; strikerId?: string; nonStriker: string; nonStrikerId?: string; bowler: string; bowlerId?: string }[]>([]);

  // Verification & Officials state
  const [officialsModal, setOfficialsModal] = useState(false);
  const [addOfficialPhone, setAddOfficialPhone] = useState('');
  const [addOfficialRole, setAddOfficialRole] = useState('scorer');

  const [verifyModal, setVerifyModal] = useState<{ teamId: string, teamName: string } | null>(null);
  const [verifyMemberId, setVerifyMemberId] = useState<string | undefined>(undefined);
  const [verifyStep, setVerifyStep] = useState<'pick' | 'otp'>('pick');
  const [verifyMasked, setVerifyMasked] = useState('');
  const [verifyLast4, setVerifyLast4] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  useEffect(() => {
    if (renameTarget === 'striker') { setRenameName(striker); setRenameMemberId(strikerId); }
    else if (renameTarget === 'nonStriker') { setRenameName(nonStriker); setRenameMemberId(nonStrikerId); }
    else if (renameTarget === 'bowler') { setRenameName(bowler); setRenameMemberId(bowlerId); }
  }, [renameTarget, striker, strikerId, nonStriker, nonStrikerId, bowler, bowlerId]);

  const mineQ = useQuery({
    queryKey: ['community-mine'],
    queryFn: () => communityMyMatches(token as string),
    enabled: !!token,
  });

  const officialsQ = useQuery({
    queryKey: ['community-officials', matchId],
    queryFn: () => communityGetOfficials(token as string, matchId),
    enabled: !!token,
    retry: false,
  });

  const q = useQuery({
    queryKey: ['community-scorecard', matchId],
    queryFn: () => communityScorecard(matchId),
    refetchInterval: 5000,
  });

  const ballMut = useMutation({
    mutationFn: (data: any) => communityBall(token as string, matchId, data),
    onMutate: () => {
      // Snapshot state BEFORE mutation goes out
      return { snapshot: { striker, strikerId, nonStriker, nonStrikerId, bowler, bowlerId } };
    },
    onSuccess: (data, variables: any, context) => {
      if (context?.snapshot) {
        historyRef.current.push(context.snapshot);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['community-scorecard', matchId] });
      setToastMsg(data.commentary);
      setTimeout(() => setToastMsg(''), 3000);
      
      setOutModal(false);
      setExtraModal(null);
      setMoreModal(false);

      // Determine runs ran by batter for swap logic
      let runsRan = variables.runs;
      if (variables.type === 'wicket' && variables.dismissalType === 'run_out') {
        runsRan = variables.runs;
      } else if (variables.type === 'wicket') {
        runsRan = 0;
      }
      
      let isSwap = runsRan % 2 !== 0;
      const overCompleted = data.inningsTotal.balls === 0 && !data.inningsComplete;
      
      if (overCompleted) {
        isSwap = !isSwap; // swap again at over end
      }

      let nextStriker = striker;
      let nextStrikerId = strikerId;
      let nextNonStriker = nonStriker;
      let nextNonStrikerId = nonStrikerId;
      let emptySlot: 'striker' | 'nonStriker' | null = null;

      if (variables.type === 'wicket') {
        emptySlot = 'striker'; // striker faced ball and was dismissed (in basic assumption)
      }

      if (isSwap) {
        const tempN = nextStriker;
        const tempId = nextStrikerId;
        nextStriker = nextNonStriker;
        nextStrikerId = nextNonStrikerId;
        nextNonStriker = tempN;
        nextNonStrikerId = tempId;
        
        if (emptySlot === 'striker') emptySlot = 'nonStriker';
        else if (emptySlot === 'nonStriker') emptySlot = 'striker';
      }

      setStriker(nextStriker);
      setStrikerId(nextStrikerId);
      setNonStriker(nextNonStriker);
      setNonStrikerId(nextNonStrikerId);

      if (variables.type === 'wicket') {
        setNewBatterTarget(emptySlot);
        if (overCompleted) {
          setQueuedBowlerPrompt(true);
        }
      } else if (overCompleted) {
        setNewBowlerModal(true);
      }
    },
    onError: (err: any) => {
      alert(err.message || 'Error scoring ball');
    }
  });

  const undoMut = useMutation({
    mutationFn: () => communityUndo(token as string, matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-scorecard', matchId] });
      const last = historyRef.current.pop();
      if (last) {
        setStriker(last.striker);
        setStrikerId(last.strikerId);
        setNonStriker(last.nonStriker);
        setNonStrikerId(last.nonStrikerId);
        setBowler(last.bowler);
        setBowlerId(last.bowlerId);
      }
    },
  });

  const inningsEndMut = useMutation({
    mutationFn: () => communityInningsEnd(token as string, matchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-scorecard', matchId] }),
  });

  const finishMut = useMutation({
    mutationFn: (data?: { abandon?: boolean }) => communityFinish(token as string, matchId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-scorecard', matchId] }),
  });

  const addOfficialMut = useMutation({
    mutationFn: (data: { phone: string; role: string }) => communityAddOfficial(token as string, matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-officials', matchId] });
      setAddOfficialPhone('');
      alert(t('Official added', 'Official जोड़ दिया गया'));
    },
    onError: (err: any) => {
      if (err.code === 'no_account') {
        alert(t('No account found on this number — ask them to install the app first.', 'इस number पर account नहीं है — पहले app install करने को कहें।'));
      } else {
        alert(err.message || 'Error adding official');
      }
    }
  });

  const removeOfficialMut = useMutation({
    mutationFn: (userId: string) => communityRemoveOfficial(token as string, matchId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-officials', matchId] }),
    onError: (err: any) => alert(err.message || 'Error removing official'),
  });

  const verifyStartMut = useMutation({
    mutationFn: (data: { teamId: string, memberId: string }) => communityVerifyTeamStart(token as string, matchId, data),
    onSuccess: (data) => {
      setVerifyMasked(data.phoneMasked);
      setVerifyStep('otp');
    },
    onError: (err: any) => alert(err.message || 'Error sending OTP'),
  });

  const verifyConfirmMut = useMutation({
    mutationFn: (data: { teamId: string, last4: string, code: string }) => communityVerifyTeamConfirm(token as string, matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-scorecard', matchId] });
      setVerifyModal(null);
      alert(t('Team verified!', 'टीम verify हो गई!'));
    },
    onError: (err: any) => {
      if (err.status === 429) {
        alert(t('Too many failed attempts — send a new OTP.', 'बहुत बार गलत — नया OTP भेजें।'));
        setVerifyStep('pick');
      } else {
        alert(err.message || 'Invalid code or last 4 digits');
      }
    }
  });

  const handleScore = (type: string, runs: number, extraData?: any) => {
    ballMut.mutate({
      type,
      runs,
      batterName: striker,
      strikerMemberId: strikerId,
      bowlerName: bowler,
      bowlerMemberId: bowlerId,
      ...extraData,
    });
  };

  const isOwner = token ? mineQ.data?.matches.some(m => m.id === matchId) : false;
  const isOfficial = token ? officialsQ.data?.officials.some(o => o.userId === user?.id && o.role === 'scorer') : false;
  const canScore = isOwner || isOfficial;

  if (!ready || q.isLoading || (token && (mineQ.isLoading || officialsQ.isLoading))) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('Scorer', 'स्कोरर')} back={true} /><LoadingView /></View>;
  }

  if (q.isError) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('Scorer', 'स्कोरर')} back={true} /><ErrorView onRetry={() => q.refetch()} /></View>;
  }

  const match = q.data?.match;
  const innings = q.data?.innings || [];
  
  const activeInnings = innings.length > 0 ? innings[innings.length - 1] : undefined;
  const isMatchComplete = match?.status === 'completed';
  const needsVerification = canScore && !!match?.teamAId && !!match?.teamBId && (!match?.teamAVerified || !match?.teamBVerified);
  const showPad = canScore && activeInnings?.status === 'live' && !needsVerification;

  const needsSetup = showPad && activeInnings && activeInnings.balls === 0 && activeInnings.totalRuns === 0 && activeInnings.totalWickets === 0 && setupInnings !== activeInnings.inningsNumber;

  const canStartInnings2 = canScore && (
    (match?.status === 'innings2' && innings.length === 1) ||
    (activeInnings?.status === 'completed' && activeInnings?.inningsNumber === 1)
  );

  const hasSecondInningsBalls = innings.length === 2 && (innings[1].balls > 0 || innings[1].totalRuns > 0 || (innings[1].recentBalls && innings[1].recentBalls.length > 0));
  const canFinishMatch = canScore && hasSecondInningsBalls && !isMatchComplete;

  const shareMatch = () => {
    const url = `https://bcplt20.com/scorecard/${matchId}`;
    const msg = `${match?.team1} vs ${match?.team2} — live score ${t('view:', 'देखें:')} ${url}`;
    Share.share({ message: msg });
  };

  const strikerData = activeInnings?.batting?.find(b => b.name === striker);
  const nonStrikerData = activeInnings?.batting?.find(b => b.name === nonStriker);
  const bowlerData = activeInnings?.bowling?.find(b => b.name === bowler);

  const formatBatter = (name: string, data: any, isStriker: boolean) => {
    if (!data) return `${name}${isStriker ? '*' : ''} 0(0)`;
    return `${name}${isStriker ? '*' : ''} ${data.runs}(${data.balls})`;
  };

  const formatBowler = (name: string, data: any) => {
    if (!data) return `${name} 0.0-0-0-0`;
    return `${name} ${Math.floor(data.overs)}.${Math.round((data.overs % 1) * 10)}-0-${data.runs}-${data.wickets}`;
  };

  const BatterSuggestions = ({ onSelect, exclude = [] }: { onSelect: (n: string, id?: string) => void, exclude?: string[] }) => {
    if (q.data?.rosters) {
      const isTeamA = activeInnings?.battingTeam === match?.team1;
      const roster = isTeamA ? q.data.rosters.teamA : q.data.rosters.teamB;
      const available = roster.filter(m => !exclude.includes(m.name));
      if (!available.length) return null;
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {available.map(m => (
            <Pressable key={m.id} onPress={() => onSelect(m.name, m.id)} style={[styles.chip, { backgroundColor: c.card2 }]}>
              <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{m.name}</Text>
              {m.role ? <Text style={{ color: c.sub, fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium' }}>{m.role}</Text> : null}
            </Pressable>
          ))}
        </View>
      );
    }
    const list = activeInnings?.batting?.map(b => b.name).filter(n => !exclude.includes(n)) || [];
    const unique = Array.from(new Set(list));
    if (!unique.length) return null;
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {unique.map(n => (
          <Pressable key={n} onPress={() => onSelect(n)} style={[styles.chip, { backgroundColor: c.card2 }]}>
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{n}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const BowlerSuggestions = ({ onSelect, exclude = [] }: { onSelect: (n: string, id?: string) => void, exclude?: string[] }) => {
    if (q.data?.rosters) {
      const isTeamA = activeInnings?.bowlingTeam === match?.team1;
      const roster = isTeamA ? q.data.rosters.teamA : q.data.rosters.teamB;
      const available = roster.filter(m => !exclude.includes(m.name));
      if (!available.length) return null;
      return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {available.map(m => (
            <Pressable key={m.id} onPress={() => onSelect(m.name, m.id)} style={[styles.chip, { backgroundColor: c.card2 }]}>
              <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{m.name}</Text>
              {m.role ? <Text style={{ color: c.sub, fontSize: 10, fontFamily: 'PlusJakartaSans_500Medium' }}>{m.role}</Text> : null}
            </Pressable>
          ))}
        </View>
      );
    }
    const list = activeInnings?.bowling?.map(b => b.name).filter(n => !exclude.includes(n)) || [];
    const unique = Array.from(new Set(list));
    if (!unique.length) return null;
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {unique.map(n => (
          <Pressable key={n} onPress={() => onSelect(n)} style={[styles.chip, { backgroundColor: c.card2 }]}>
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{n}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

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
      <GlassAppBar
        title={t('Scorer', 'स्कोरर')}
        back={true}
        right={isOwner ? (
          <Pressable onPress={() => setOfficialsModal(true)} style={{ padding: 8 }}>
            <Feather name="settings" size={22} color={c.ink} />
          </Pressable>
        ) : undefined}
      />
      
      <ScrollView contentContainerStyle={{ paddingBottom: bottomNavHeight + 40, paddingTop: appBarHeight }}>
        
        {/* SCORE HEADER */}
        {activeInnings ? (
          <View style={{ padding: 16, alignItems: 'center', position: 'relative' }}>
            <Pressable onPress={shareMatch} style={({pressed}) => [{ position: 'absolute', right: 16, top: 0, padding: 8, opacity: pressed ? 0.6 : 1 }]}>
              <Ionicons name="share-social" size={24} color={c.ink} />
            </Pressable>
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 }}>
              {activeInnings.battingTeam} {t('Batting', 'बल्लेबाज़ी')}
            </Text>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 48, lineHeight: 56 }}>
              {activeInnings.totalRuns}/{activeInnings.totalWickets}
            </Text>
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20 }}>
              {t('Overs:', 'ओवर्स:')} {activeInnings.overs}.{activeInnings.balls} <Text style={{ color: c.sub }}>/ {match?.oversLimit}</Text>
            </Text>
            
            {/* Player inline stats */}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
              <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>
                {formatBatter(striker, strikerData, true)}
              </Text>
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 }}>
                {formatBatter(nonStriker, nonStrikerData, false)}
              </Text>
            </View>
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, marginTop: 4 }}>
              {formatBowler(bowler, bowlerData)}
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

        {/* NOT SCORER BANNER */}
        {!canScore && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Card style={{ backgroundColor: `${c.cyan}20`, borderColor: c.cyan, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: c.cyan, fontFamily: 'PlusJakartaSans_700Bold' }}>
                {t('Live Scorecard Mode', 'लाइव स्कोरकार्ड मोड')}
              </Text>
            </Card>
          </View>
        )}

        {isMatchComplete && match?.resultDesc && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16, gap: 12 }}>
            <LinearGradient colors={['#5B2BF0', '#FF3DA6']} start={{x:0,y:0}} end={{x:1,y:1}} style={{ padding: 20, borderRadius: 16, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, textAlign: 'center' }}>
                {match.resultDesc}
              </Text>
            </LinearGradient>
            <Pressable onPress={shareMatch} style={{ backgroundColor: c.card2, padding: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="share-social" size={20} color={c.ink} />
              <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>
                {t('Share Result', 'परिणाम शेयर करें')}
              </Text>
            </Pressable>
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

        {/* VERIFICATION REQUIRED BANNER */}
        {needsVerification && (
          <Card style={{ marginHorizontal: 16, marginBottom: 16, padding: 20, backgroundColor: `${c.coral}10`, borderColor: c.coral }}>
            <Feather name="shield" size={24} color={c.coral} style={{ marginBottom: 12 }} />
            <Text style={{ color: c.coral, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 8 }}>
              {t('Team Verification Required', 'टीम verification ज़रूरी')}
            </Text>
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 16 }}>
              {t('Both linked teams must be verified before scoring can start.', 'स्कोरिंग शुरू करने से पहले दोनों टीमों का verify होना ज़रूरी है।')}
            </Text>
            
            <View style={{ gap: 12 }}>
              {!match.teamAVerified && (
                <Pressable onPress={() => { setVerifyModal({ teamId: match.teamAId!, teamName: match.team1 }); setVerifyStep('pick'); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: c.coral }}>
                  <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>{match.team1}</Text>
                  <Text style={{ color: c.coral, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Verify Now', 'अभी verify करें')}</Text>
                </Pressable>
              )}
              {!match.teamBVerified && (
                <Pressable onPress={() => { setVerifyModal({ teamId: match.teamBId!, teamName: match.team2 }); setVerifyStep('pick'); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: c.coral }}>
                  <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>{match.team2}</Text>
                  <Text style={{ color: c.coral, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Verify Now', 'अभी verify करें')}</Text>
                </Pressable>
              )}
            </View>
          </Card>
        )}

        {/* INNINGS SETUP CARD */}
        {needsSetup ? (
          <Card style={{ marginHorizontal: 16, marginBottom: 16, padding: 20 }}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 16 }}>
              {t('Start Innings', 'पारी शुरू करें')}
            </Text>
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 4 }}>{t('Striker', 'स्ट्राइकर')}</Text>
            <TextInput value={setupS} onChangeText={(v) => { setSetupS(v); setSetupSId(undefined); }} style={[styles.inputChip, { backgroundColor: c.card, color: c.ink, borderColor: c.line, marginBottom: 4, textAlign: 'left' }]} />
            <BatterSuggestions onSelect={(n, id) => { setSetupS(n); setSetupSId(id); }} exclude={[setupNs]} />
            
            <View style={{ height: 12 }} />
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 4 }}>{t('Non-Striker', 'नॉन-स्ट्राइकर')}</Text>
            <TextInput value={setupNs} onChangeText={(v) => { setSetupNs(v); setSetupNsId(undefined); }} style={[styles.inputChip, { backgroundColor: c.card, color: c.ink, borderColor: c.line, marginBottom: 4, textAlign: 'left' }]} />
            <BatterSuggestions onSelect={(n, id) => { setSetupNs(n); setSetupNsId(id); }} exclude={[setupS]} />
            
            <View style={{ height: 12 }} />
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', marginBottom: 4 }}>{t('Bowler', 'गेंदबाज़')}</Text>
            <TextInput value={setupB} onChangeText={(v) => { setSetupB(v); setSetupBId(undefined); }} style={[styles.inputChip, { backgroundColor: c.card, color: c.ink, borderColor: c.line, marginBottom: 4, textAlign: 'left' }]} />
            <BowlerSuggestions onSelect={(n, id) => { setSetupB(n); setSetupBId(id); }} />
            
            <View style={{ height: 24 }} />
            <Pressable onPress={() => { setStriker(setupS); setStrikerId(setupSId); setNonStriker(setupNs); setNonStrikerId(setupNsId); setBowler(setupB); setBowlerId(setupBId); setSetupInnings(activeInnings.inningsNumber); }} style={{ borderRadius: 12, overflow: 'hidden' }}>
              <LinearGradient colors={['#00DCF5', '#5B2BF0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>
                  {t('Start Scoring', 'Scoring शुरू करें')}
                </Text>
              </LinearGradient>
            </Pressable>
          </Card>
        ) : (
          /* INPUT CHIPS */
          showPad && (
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
              <Pressable onPress={() => setRenameTarget('striker')} style={[styles.chip, { flex: 1, backgroundColor: c.card2 }]}>
                <Text style={{ color: c.sub, fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Striker', 'स्ट्राइकर')}</Text>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold' }} numberOfLines={1}>{striker}</Text>
              </Pressable>
              <Pressable onPress={() => { const s = striker; const sId = strikerId; setStriker(nonStriker); setStrikerId(nonStrikerId); setNonStriker(s); setNonStrikerId(sId); }} style={{ justifyContent: 'center', padding: 8 }}>
                <Feather name="repeat" size={16} color={c.sub} />
              </Pressable>
              <Pressable onPress={() => setRenameTarget('nonStriker')} style={[styles.chip, { flex: 1, backgroundColor: c.card2 }]}>
                <Text style={{ color: c.sub, fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Non-Striker', 'नॉन-स्ट्राइकर')}</Text>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold' }} numberOfLines={1}>{nonStriker}</Text>
              </Pressable>
              <Pressable onPress={() => setRenameTarget('bowler')} style={[styles.chip, { flex: 1, backgroundColor: c.card2 }]}>
                <Text style={{ color: c.sub, fontSize: 10, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Bowler', 'गेंदबाज़')}</Text>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold' }} numberOfLines={1}>{bowler}</Text>
              </Pressable>
            </View>
          )
        )}

        {/* GIANT PAD */}
        {showPad && !needsSetup && (
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

      {/* RENAME MODAL */}
      <Modal visible={!!renameTarget} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: c.bg, borderColor: c.line, borderWidth: 1 }]}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 16 }}>
              {t('Change Name', 'नाम बदलें')}
            </Text>
            <TextInput
              value={renameName}
              onChangeText={(v) => { setRenameName(v); setRenameMemberId(undefined); }}
              style={[styles.inputChip, { backgroundColor: c.card, color: c.ink, borderColor: c.line, textAlign: 'left', marginBottom: 8 }]}
            />
            
            {renameTarget === 'striker' || renameTarget === 'nonStriker' ? (
              <BatterSuggestions onSelect={(n, id) => { setRenameName(n); setRenameMemberId(id); }} exclude={[renameTarget === 'striker' ? nonStriker : striker]} />
            ) : (
              <BowlerSuggestions onSelect={(n, id) => { setRenameName(n); setRenameMemberId(id); }} />
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <Pressable onPress={() => setRenameTarget(null)} style={[styles.modalBtn, { backgroundColor: c.card2 }]}>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Cancel', 'रद्द करें')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (renameTarget === 'striker') { setStriker(renameName || 'Batter'); setStrikerId(renameMemberId); }
                  else if (renameTarget === 'nonStriker') { setNonStriker(renameName || 'Batter'); setNonStrikerId(renameMemberId); }
                  else if (renameTarget === 'bowler') { setBowler(renameName || 'Bowler'); setBowlerId(renameMemberId); }
                  setRenameTarget(null);
                }}
                style={[styles.modalBtn, { backgroundColor: c.cyan }]}
              >
                <Text style={{ color: c.bg, fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Save', 'सेव करें')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* NEW BATTER MODAL */}
      <Modal visible={!!newBatterTarget} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: c.bg, borderColor: c.line, borderWidth: 1 }]}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 16 }}>
              {t('New batter?', 'नया batter कौन?')}
            </Text>
            <TextInput
              value={newBatterName}
              onChangeText={(v) => { setNewBatterName(v); setNewBatterId(undefined); }}
              style={[styles.inputChip, { backgroundColor: c.card, color: c.ink, borderColor: c.line, textAlign: 'left', marginBottom: 8 }]}
            />
            
            <BatterSuggestions onSelect={(n, id) => { setNewBatterName(n); setNewBatterId(id); }} exclude={[striker, nonStriker]} />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <Pressable
                onPress={() => {
                  if (newBatterTarget === 'striker') { setStriker(newBatterName || 'Batter'); setStrikerId(newBatterId); }
                  else { setNonStriker(newBatterName || 'Batter'); setNonStrikerId(newBatterId); }
                  setNewBatterTarget(null);
                  setNewBatterName('');
                  setNewBatterId(undefined);
                  if (queuedBowlerPrompt) {
                    setQueuedBowlerPrompt(false);
                    setNewBowlerModal(true);
                  }
                }}
                style={[styles.modalBtn, { backgroundColor: c.cyan }]}
              >
                <Text style={{ color: c.bg, fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Confirm', 'पुष्टि करें')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* NEW BOWLER MODAL */}
      <Modal visible={newBowlerModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: c.bg, borderColor: c.line, borderWidth: 1 }]}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 16 }}>
              {t('New over — who bowls?', 'नया over — bowler कौन?')}
            </Text>
            <TextInput
              value={newBowlerName}
              onChangeText={(v) => { setNewBowlerName(v); setNewBowlerId(undefined); }}
              style={[styles.inputChip, { backgroundColor: c.card, color: c.ink, borderColor: c.line, textAlign: 'left', marginBottom: 8 }]}
            />
            
            <BowlerSuggestions onSelect={(n, id) => { setNewBowlerName(n); setNewBowlerId(id); }} exclude={[bowler]} />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <Pressable onPress={() => { setNewBowlerModal(false); setNewBowlerName(''); setNewBowlerId(undefined); }} style={[styles.modalBtn, { backgroundColor: c.card2 }]}>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Keep same', 'वही जारी रखें')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (newBowlerName) {
                    setBowler(newBowlerName);
                    setBowlerId(newBowlerId);
                  }
                  setNewBowlerModal(false);
                  setNewBowlerName('');
                  setNewBowlerId(undefined);
                }}
                style={[styles.modalBtn, { backgroundColor: c.cyan }]}
              >
                <Text style={{ color: c.bg, fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Confirm', 'पुष्टि करें')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
              {(extraModal?.type === 'bye' || extraModal?.type === 'legbye' ? [1, 2, 3, 4] : [0, 1, 2, 3, 4]).map(r => (
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

      {/* VERIFY TEAM MODAL */}
      <Modal visible={!!verifyModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: c.bg, borderColor: c.line, borderWidth: 1 }]}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 8 }}>
              {t('Verify', 'Verify करें')} {verifyModal?.teamName}
            </Text>
            
            {verifyStep === 'pick' ? (
              <>
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 16 }}>
                  {t('Select a player from the roster to receive the OTP.', 'रोस्टर से किसी खिलाड़ी को चुनें जिसे OTP भेजा जाएगा।')}
                </Text>
                
                <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
                  {q.data?.rosters?.[verifyModal?.teamId === match?.teamAId ? 'teamA' : 'teamB']?.map(m => (
                    <Pressable
                      key={m.id}
                      onPress={() => setVerifyMemberId(m.id)}
                      style={{ padding: 12, borderRadius: 12, backgroundColor: verifyMemberId === m.id ? c.cyan : c.card2, marginBottom: 8 }}
                    >
                      <Text style={{ color: verifyMemberId === m.id ? c.bg : c.ink, fontFamily: 'PlusJakartaSans_700Bold' }}>{m.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable onPress={() => { setVerifyModal(null); setVerifyMemberId(undefined); }} style={[styles.modalBtn, { backgroundColor: c.card2 }]}>
                    <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Cancel', 'रद्द करें')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (!verifyMemberId) return alert(t('Please select a player', 'कृपया खिलाड़ी चुनें'));
                      verifyStartMut.mutate({ teamId: verifyModal!.teamId, memberId: verifyMemberId });
                    }}
                    disabled={verifyStartMut.isPending}
                    style={[styles.modalBtn, { backgroundColor: verifyMemberId ? c.cyan : c.card2 }]}
                  >
                    <Text style={{ color: verifyMemberId ? c.bg : c.sub, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      {verifyStartMut.isPending ? t('Sending...', 'भेज रहे हैं...') : t('Send OTP', 'OTP भेजें')}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 16 }}>
                  {t('OTP sent to', 'OTP भेजा गया')} <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', color: c.ink }}>{verifyMasked}</Text>. {t('Enter last 4 digits of their phone number and the OTP.', 'उनके फ़ोन के आखिरी 4 अंक और OTP दर्ज करें।')}
                </Text>

                <TextInput
                  value={verifyLast4}
                  onChangeText={setVerifyLast4}
                  placeholder={t('Last 4 digits', 'आखिरी 4 अंक')}
                  keyboardType="number-pad"
                  maxLength={4}
                  style={[styles.inputChip, { backgroundColor: c.card, color: c.ink, borderColor: c.line, marginBottom: 12, textAlign: 'left' }]}
                />
                <TextInput
                  value={verifyCode}
                  onChangeText={setVerifyCode}
                  placeholder={t('6-digit OTP', '6-अंकों का OTP')}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.inputChip, { backgroundColor: c.card, color: c.ink, borderColor: c.line, marginBottom: 24, textAlign: 'left' }]}
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable onPress={() => { setVerifyStep('pick'); setVerifyLast4(''); setVerifyCode(''); }} style={[styles.modalBtn, { backgroundColor: c.card2 }]}>
                    <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Back', 'वापस')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (verifyLast4.length !== 4) return alert(t('Enter last 4 digits', 'आखिरी 4 अंक दर्ज करें'));
                      if (verifyCode.length !== 6) return alert(t('Enter 6-digit OTP', '6-अंकों का OTP दर्ज करें'));
                      verifyConfirmMut.mutate({ teamId: verifyModal!.teamId, last4: verifyLast4, code: verifyCode });
                    }}
                    disabled={verifyConfirmMut.isPending}
                    style={[styles.modalBtn, { backgroundColor: c.cyan }]}
                  >
                    <Text style={{ color: c.bg, fontFamily: 'PlusJakartaSans_700Bold' }}>
                      {verifyConfirmMut.isPending ? t('Verifying...', 'जांच रहे हैं...') : t('Verify', 'Verify करें')}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* OFFICIALS MODAL */}
      <Modal visible={officialsModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: c.bg, borderColor: c.line, borderWidth: 1, maxHeight: '80%' }]}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 16 }}>
              {t('Match Officials', 'मैच Officials')}
            </Text>

            <ScrollView style={{ marginBottom: 16 }}>
              {officialsQ.data?.officials?.length === 0 && (
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', textAlign: 'center', marginVertical: 12 }}>
                  {t('No officials added yet.', 'अभी कोई official नहीं जोड़ा गया है।')}
                </Text>
              )}
              {officialsQ.data?.officials?.map(o => (
                <View key={o.userId} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.card2, padding: 12, borderRadius: 12, marginBottom: 8 }}>
                  <View>
                    <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold' }}>{o.name}</Text>
                    <Text style={{ color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', textTransform: 'capitalize' }}>{o.role}</Text>
                  </View>
                  <Pressable onPress={() => removeOfficialMut.mutate(o.userId)} style={{ padding: 8 }}>
                    <Feather name="trash-2" size={16} color={c.coral} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 8 }}>
              {t('Add Official', 'Official जोड़ें')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <Pressable onPress={() => setAddOfficialRole('scorer')} style={[styles.chip, { flex: 1, backgroundColor: addOfficialRole === 'scorer' ? c.violet : c.card2, alignItems: 'center' }]}>
                <Text style={{ color: addOfficialRole === 'scorer' ? '#fff' : c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Scorer</Text>
              </Pressable>
              <Pressable onPress={() => setAddOfficialRole('umpire')} style={[styles.chip, { flex: 1, backgroundColor: addOfficialRole === 'umpire' ? c.violet : c.card2, alignItems: 'center' }]}>
                <Text style={{ color: addOfficialRole === 'umpire' ? '#fff' : c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>Umpire</Text>
              </Pressable>
            </View>
            <TextInput
              value={addOfficialPhone}
              onChangeText={setAddOfficialPhone}
              placeholder={t('Phone number', 'फ़ोन नंबर')}
              keyboardType="phone-pad"
              style={[styles.inputChip, { backgroundColor: c.card, color: c.ink, borderColor: c.line, textAlign: 'left', marginBottom: 16 }]}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => setOfficialsModal(false)} style={[styles.modalBtn, { backgroundColor: c.card2 }]}>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Close', 'बंद करें')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (addOfficialPhone.length < 10) return alert(t('Enter valid phone number', 'सही फ़ोन नंबर दर्ज करें'));
                  addOfficialMut.mutate({ phone: addOfficialPhone, role: addOfficialRole });
                }}
                disabled={addOfficialMut.isPending}
                style={[styles.modalBtn, { backgroundColor: c.violet }]}
              >
                <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {addOfficialMut.isPending ? t('Adding...', 'जोड़ रहे हैं...') : t('Add', 'जोड़ें')}
                </Text>
              </Pressable>
            </View>
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