import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { communityGetProfile, communityUpdateProfile, communityGetProfileStats } from '@/lib/api';
import { GlassAppBar, ScreenBackground, Card, useAppBarHeight, useBottomNavHeight, ErrorView, LoadingView } from '@/components/ui';

export default function ScorerProfileScreen() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const { t } = useLang();
  const c = useColors();
  const queryClient = useQueryClient();
  
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('batsman');
  const [battingStyle, setBattingStyle] = useState('right');
  const [bowlingStyle, setBowlingStyle] = useState('');

  const profileQ = useQuery({
    queryKey: ['community-profile'],
    queryFn: () => communityGetProfile(token as string),
    enabled: !!token,
    retry: (failureCount, error: any) => error.status !== 404 && failureCount < 3,
  });

  const statsQ = useQuery({
    queryKey: ['community-profile-stats'],
    queryFn: () => communityGetProfileStats(token as string),
    enabled: !!token && !!profileQ.data?.profile,
  });

  useEffect(() => {
    if (profileQ.data?.profile && !isEditing) {
      setDisplayName(profileQ.data.profile.displayName);
      setRole(profileQ.data.profile.role);
      setBattingStyle(profileQ.data.profile.battingStyle);
      setBowlingStyle(profileQ.data.profile.bowlingStyle || '');
    }
  }, [profileQ.data?.profile]);

  const updateMut = useMutation({
    mutationFn: (data: any) => communityUpdateProfile(token as string, data),
    onSuccess: (res) => {
      queryClient.setQueryData(['community-profile'], { profile: res.profile });
      setIsEditing(false);
    },
    onError: (err: any) => {
      alert(err.message || 'Error updating profile');
    }
  });

  if (!ready || profileQ.isLoading) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('My Profile', 'मेरी प्रोफ़ाइल')} /><LoadingView /></View>;
  }

  if (profileQ.isError && (profileQ.error as any).status !== 404) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('My Profile', 'मेरी प्रोफ़ाइल')} /><ErrorView onRetry={() => profileQ.refetch()} /></View>;
  }

  const profile = profileQ.data?.profile;
  const needsCreation = !profile || (profileQ.isError && (profileQ.error as any).status === 404);

  const handleSave = () => {
    if (!displayName.trim()) return alert(t('Display name is required', 'नाम दर्ज करें'));
    updateMut.mutate({
      displayName: displayName.trim(),
      role,
      battingStyle,
      bowlingStyle: bowlingStyle.trim() || undefined,
    });
  };

  const renderRoleBtn = (value: string, labelEn: string, labelHi: string, icon: any) => (
    <Pressable
      onPress={() => setRole(value)}
      style={[styles.roleBtn, { backgroundColor: role === value ? c.cyan : c.card2, borderColor: role === value ? c.cyan : c.line }]}
    >
      <Feather name={icon} size={16} color={role === value ? c.bg : c.sub} />
      <Text style={{ color: role === value ? c.bg : c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, marginTop: 4 }}>
        {t(labelEn, labelHi)}
      </Text>
    </Pressable>
  );

  const stats = statsQ.data?.stats;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('Cricket Profile', 'क्रिकेट प्रोफ़ाइल')} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: bottomNavHeight + 40, paddingTop: appBarHeight }}>
        
        {(needsCreation || isEditing) ? (
          <View style={{ padding: 16, gap: 16 }}>
            {needsCreation && (
              <Card style={{ backgroundColor: `${c.violet}20`, borderColor: c.violet, padding: 16, marginBottom: 8 }}>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, marginBottom: 4 }}>
                  {t('Create your profile', 'अपनी प्रोफ़ाइल बनाएं')}
                </Text>
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 }}>
                  {t('Join the community scorer network to track your stats across all local matches.', 'लोकल मैचों में अपने आंकड़े ट्रैक करने के लिए कम्युनिटी स्कोरर नेटवर्क से जुड़ें।')}
                </Text>
              </Card>
            )}

            <Card padding={20} style={{ gap: 20 }}>
              <View>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
                  {t('Display Name', 'दिखाने वाला नाम')}
                </Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={t('e.g. Rahul K', 'जैसे राहुल के')}
                  placeholderTextColor={c.sub}
                  style={[styles.input, { backgroundColor: c.card2, color: c.ink, borderColor: c.line }]}
                />
              </View>

              <View>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
                  {t('Primary Role', 'मुख्य भूमिका')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {renderRoleBtn('batsman', 'Batsman', 'बल्लेबाज़', 'bold')}
                  {renderRoleBtn('bowler', 'Bowler', 'गेंदबाज़', 'target')}
                  {renderRoleBtn('all_rounder', 'All-Rounder', 'ऑल-राउंडर', 'star')}
                  {renderRoleBtn('wicket_keeper', 'Wkt Keeper', 'विकेटकीपर', 'shield')}
                </View>
              </View>

              <View>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
                  {t('Batting Style', 'बल्लेबाज़ी शैली')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={() => setBattingStyle('right')}
                    style={[styles.chip, { flex: 1, backgroundColor: battingStyle === 'right' ? c.magenta : c.card2 }]}
                  >
                    <Text style={{ color: battingStyle === 'right' ? '#fff' : c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', textAlign: 'center' }}>
                      {t('Right Hand', 'दाएं हाथ')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setBattingStyle('left')}
                    style={[styles.chip, { flex: 1, backgroundColor: battingStyle === 'left' ? c.magenta : c.card2 }]}
                  >
                    <Text style={{ color: battingStyle === 'left' ? '#fff' : c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', textAlign: 'center' }}>
                      {t('Left Hand', 'बाएं हाथ')}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
                  {t('Bowling Style (Optional)', 'गेंदबाज़ी शैली (वैकल्पिक)')}
                </Text>
                <TextInput
                  value={bowlingStyle}
                  onChangeText={setBowlingStyle}
                  placeholder={t('e.g. Right-arm fast', 'जैसे दायां हाथ तेज़')}
                  placeholderTextColor={c.sub}
                  style={[styles.input, { backgroundColor: c.card2, color: c.ink, borderColor: c.line }]}
                />
              </View>
            </Card>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              {!needsCreation && (
                <Pressable onPress={() => setIsEditing(false)} style={[styles.actionBtn, { backgroundColor: c.card2, flex: 1 }]}>
                  <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Cancel', 'रद्द करें')}</Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleSave}
                disabled={updateMut.isPending}
                style={[styles.actionBtn, { backgroundColor: c.violet, flex: needsCreation ? undefined : 2, width: needsCreation ? '100%' : undefined }]}
              >
                {updateMut.isPending ? <ActivityIndicator color="#fff" size="small" /> : (
                  <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Save Profile', 'प्रोफ़ाइल सेव करें')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ padding: 16, gap: 24 }}>
            {/* VIEW MODE */}
            <Card padding={0} style={{ overflow: 'hidden' }}>
              <LinearGradient colors={[`${c.violet}20`, 'transparent']} style={{ padding: 24, alignItems: 'center' }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.violet, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 32 }}>
                    {profile?.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginBottom: 4 }}>
                  {profile?.displayName}
                </Text>
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, textTransform: 'capitalize' }}>
                  {profile?.role.replace('_', ' ')} · {profile?.battingStyle} Hand Bat
                  {profile?.bowlingStyle ? ` · ${profile.bowlingStyle}` : ''}
                </Text>
                <Pressable onPress={() => setIsEditing(true)} style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: c.line }}>
                  <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
                    {t('Edit Profile', 'प्रोफ़ाइल एडिट करें')}
                  </Text>
                </Pressable>
              </LinearGradient>
            </Card>

            {statsQ.isLoading ? (
              <LoadingView />
            ) : statsQ.isError ? (
              <ErrorView onRetry={() => statsQ.refetch()} />
            ) : stats ? (
              <View style={{ gap: 16 }}>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18 }}>
                  {t('Career Stats', 'करियर आंकड़े')}
                </Text>
                
                <Card padding={16} style={{ gap: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Feather name="bold" size={18} color={c.magenta} />
                    <Text style={{ color: c.magenta, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>
                      {t('Batting', 'बल्लेबाज़ी')}
                    </Text>
                  </View>
                  <View style={styles.statGrid}>
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: c.ink }]}>{stats.batting.matches}</Text>
                      <Text style={[styles.statLabel, { color: c.sub }]}>M</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: c.ink }]}>{stats.batting.innings}</Text>
                      <Text style={[styles.statLabel, { color: c.sub }]}>INN</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: c.ink }]}>{stats.batting.runs}</Text>
                      <Text style={[styles.statLabel, { color: c.sub }]}>RUNS</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: c.ink }]}>{stats.batting.balls}</Text>
                      <Text style={[styles.statLabel, { color: c.sub }]}>BALLS</Text>
                    </View>
                  </View>
                  <View style={styles.statGrid}>
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: c.ink }]}>{stats.batting.fours}</Text>
                      <Text style={[styles.statLabel, { color: c.sub }]}>4s</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: c.ink }]}>{stats.batting.sixes}</Text>
                      <Text style={[styles.statLabel, { color: c.sub }]}>6s</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: c.ink }]}>{stats.batting.strikeRate}</Text>
                      <Text style={[styles.statLabel, { color: c.sub }]}>SR</Text>
                    </View>
                    <View style={styles.statBox} />
                  </View>
                </Card>

                <Card padding={16} style={{ gap: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Feather name="target" size={18} color={c.cyan} />
                    <Text style={{ color: c.cyan, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>
                      {t('Bowling', 'गेंदबाज़ी')}
                    </Text>
                  </View>
                  <View style={styles.statGrid}>
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: c.ink }]}>{stats.bowling.matches}</Text>
                      <Text style={[styles.statLabel, { color: c.sub }]}>M</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: c.ink }]}>{stats.bowling.innings}</Text>
                      <Text style={[styles.statLabel, { color: c.sub }]}>INN</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: c.ink }]}>{stats.bowling.wickets}</Text>
                      <Text style={[styles.statLabel, { color: c.sub }]}>WKTS</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: c.ink }]}>{Math.floor(stats.bowling.balls / 6)}.{stats.bowling.balls % 6}</Text>
                      <Text style={[styles.statLabel, { color: c.sub }]}>OVERS</Text>
                    </View>
                  </View>
                  <View style={styles.statGrid}>
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: c.ink }]}>{stats.bowling.runsConceded}</Text>
                      <Text style={[styles.statLabel, { color: c.sub }]}>RUNS</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statVal, { color: c.ink }]}>{stats.bowling.economy}</Text>
                      <Text style={[styles.statLabel, { color: c.sub }]}>ECON</Text>
                    </View>
                    <View style={styles.statBox} />
                    <View style={styles.statBox} />
                  </View>
                </Card>

              </View>
            ) : null}

          </View>
        )}

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
  roleBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  chip: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  }
});
