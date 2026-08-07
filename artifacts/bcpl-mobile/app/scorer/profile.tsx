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
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { putToPresignedUrl, communityProfileMediaPresign, communityProfileMediaConfirm } from '@/lib/api';

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

  const [uploading, setUploading] = useState<'photo' | 'cover' | null>(null);

  if (!ready || profileQ.isLoading) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('My Profile', 'मेरी प्रोफ़ाइल')} back={true} /><LoadingView /></View>;
  }

  if (profileQ.isError && (profileQ.error as any).status !== 404) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('My Profile', 'मेरी प्रोफ़ाइल')} back={true} /><ErrorView onRetry={() => profileQ.refetch()} /></View>;
  }

  const profile = profileQ.data?.profile;
  const needsCreation = !profile || (profileQ.isError && (profileQ.error as any).status === 404);

  const handleMediaUpload = async (slot: 'photo' | 'cover') => {
    if (!token) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: slot === 'photo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });
      if (res.canceled || !res.assets[0]) return;
      const asset = res.assets[0];
      setUploading(slot);
      
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      
      const { presignedUrl, s3Key } = await communityProfileMediaPresign(token, slot, blob.type || 'image/jpeg', blob.size);
      await putToPresignedUrl(presignedUrl, blob, blob.type || 'image/jpeg');
      await communityProfileMediaConfirm(token, slot, s3Key);
      queryClient.invalidateQueries({ queryKey: ['communityProfile', token] });
    } catch (e: any) {
      alert(e.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = () => {
    if (!displayName.trim() || !bowlingStyle.trim()) return alert(t('Display name and bowling style are required', 'नाम और गेंदबाज़ी शैली दर्ज करें'));
    updateMut.mutate({
      displayName: displayName.trim(),
      role,
      battingStyle,
      bowlingStyle: bowlingStyle.trim(),
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
      <GlassAppBar title={t('Cricket Profile', 'क्रिकेट प्रोफ़ाइल')} back={true} />
      
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
                  {t('Bowling Style', 'गेंदबाज़ी शैली')}
                </Text>
                <TextInput
                  value={bowlingStyle}
                  onChangeText={setBowlingStyle}
                  placeholder={t('e.g. Right-arm fast, Off-spin, None', 'जैसे दायां हाथ तेज़, ऑफ़-स्पिन, कोई नहीं')}
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
              <Pressable onPress={() => handleMediaUpload('cover')} style={{ height: 120, backgroundColor: c.card2, position: 'relative' }}>
                {profile?.coverUrl ? (
                  <Image source={{ uri: profile.coverUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <LinearGradient colors={[`${c.violet}20`, `${c.violet}10`]} style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="camera" size={24} color={c.sub} />
                  </LinearGradient>
                )}
                {uploading === 'cover' && (
                  <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </Pressable>
              
              <View style={{ alignItems: 'center', marginTop: -40 }}>
                <Pressable onPress={() => handleMediaUpload('photo')} style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.violet, borderWidth: 4, borderColor: c.card, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {profile?.photoUrl ? (
                    <Image source={{ uri: profile.photoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 32 }}>
                      {profile?.displayName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                  {uploading === 'photo' && (
                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                </Pressable>
              </View>

              <View style={{ padding: 24, paddingTop: 16, alignItems: 'center' }}>
                <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginBottom: 4 }}>
                  {profile?.displayName}
                </Text>
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, textTransform: 'capitalize' }}>
                  {profile?.role.replace('_', ' ')} · {profile?.battingStyle} Hand Bat
                  {profile?.bowlingStyle ? ` · ${profile.bowlingStyle}` : ''}
                </Text>
                <Pressable onPress={() => setIsEditing(true)} style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: c.card2, borderWidth: 1, borderColor: c.line }}>
                  <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
                    {t('Edit Profile', 'प्रोफ़ाइल एडिट करें')}
                  </Text>
                </Pressable>
              </View>
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
