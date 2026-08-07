import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { communityMyTeams, communityCreateTeam } from '@/lib/api';
import { GlassAppBar, ScreenBackground, Card, useAppBarHeight, useBottomNavHeight, ErrorView, LoadingView } from '@/components/ui';

export default function ScorerTeamsScreen() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const { t } = useLang();
  const c = useColors();
  const queryClient = useQueryClient();
  
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const [createModal, setCreateModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');

  const q = useQuery({
    queryKey: ['community-teams'],
    queryFn: () => communityMyTeams(token as string),
    enabled: !!token,
  });

  const createMut = useMutation({
    mutationFn: (data: any) => communityCreateTeam(token as string, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['community-teams'] });
      setCreateModal(false);
      setTeamName('');
      setShortName('');
      router.push(`/scorer/team/${res.team.id}`);
    },
    onError: (err: any) => {
      alert(err.message || 'Error creating team');
    }
  });

  if (!ready || q.isLoading) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('My Teams', 'मेरी टीमें')} back={true} /><LoadingView /></View>;
  }

  if (q.isError) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('My Teams', 'मेरी टीमें')} back={true} /><ErrorView onRetry={() => q.refetch()} /></View>;
  }

  const teams = q.data?.teams || [];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('My Teams', 'मेरी टीमें')} back={true} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: bottomNavHeight + 40, paddingTop: appBarHeight }}>
        <View style={{ padding: 16, gap: 16 }}>
          
          <Pressable
            onPress={() => setCreateModal(true)}
            style={({ pressed }) => [{ borderRadius: 16, overflow: 'hidden', opacity: pressed ? 0.9 : 1 }]}
          >
            <LinearGradient colors={['#00DCF5', '#5B2BF0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 24, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12 }}>
              <Feather name="shield" size={24} color="#fff" />
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20 }}>
                {t('Create New Team', 'नई टीम बनाएं')}
              </Text>
            </LinearGradient>
          </Pressable>

          {teams.length === 0 ? (
            <Card style={{ alignItems: 'center', paddingVertical: 40, marginTop: 16 }}>
              <Feather name="users" size={32} color={c.sub} style={{ marginBottom: 12 }} />
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15 }}>
                {t("You haven't created any teams yet.", "आपने अभी तक कोई टीम नहीं बनाई है।")}
              </Text>
            </Card>
          ) : (
            <View style={{ gap: 12, marginTop: 16 }}>
              {teams.map(tData => (
                <Pressable
                  key={tData.id}
                  onPress={() => router.push(`/scorer/team/${tData.id}`)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                >
                  <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${c.cyan}20`, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: c.cyan, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>
                        {tData.shortName}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, marginBottom: 4 }}>
                        {tData.name}
                      </Text>
                      <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 }}>
                        {new Date(tData.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={c.sub} />
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* CREATE MODAL */}
      <Modal visible={createModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: c.bg, borderColor: c.line, borderWidth: 1 }]}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 16 }}>
              {t('Create Team', 'नई टीम बनाएं')}
            </Text>
            
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
              {t('Team Name', 'टीम का नाम')}
            </Text>
            <TextInput
              value={teamName}
              onChangeText={setTeamName}
              placeholder={t('e.g. Blue Stars', 'जैसे Blue Stars')}
              placeholderTextColor={c.sub}
              style={[styles.input, { backgroundColor: c.card, color: c.ink, borderColor: c.line, marginBottom: 16 }]}
            />

            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
              {t('Short Name (3-5 chars)', 'छोटा नाम')}
            </Text>
            <TextInput
              value={shortName}
              onChangeText={(v) => setShortName(v.toUpperCase())}
              placeholder="e.g. BLS"
              placeholderTextColor={c.sub}
              maxLength={5}
              style={[styles.input, { backgroundColor: c.card, color: c.ink, borderColor: c.line, marginBottom: 24 }]}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => setCreateModal(false)} style={[styles.modalBtn, { backgroundColor: c.card2 }]}>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Cancel', 'रद्द करें')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!teamName.trim() || !shortName.trim()) return alert(t('Please fill all fields', 'सभी विवरण भरें'));
                  createMut.mutate({ name: teamName.trim(), shortName: shortName.trim() });
                }}
                disabled={createMut.isPending}
                style={[styles.modalBtn, { backgroundColor: c.cyan }]}
              >
                {createMut.isPending ? <ActivityIndicator size="small" color={c.bg} /> : (
                  <Text style={{ color: c.bg, fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Create', 'बनाएं')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  }
});
