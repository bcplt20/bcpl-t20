import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { communityGetTeam, communityUpdateTeam, communityAddMember, communityRemoveMember, communityDeleteTeam, communityTeamMediaPresign, communityTeamMediaConfirm, putToPresignedUrl } from '@/lib/api';
import { GlassAppBar, ScreenBackground, Card, useAppBarHeight, useBottomNavHeight, ErrorView, LoadingView, TeamDot } from '@/components/ui';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

export default function ScorerTeamDetailScreen() {
  const { id } = useLocalSearchParams();
  const teamId = id as string;
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const { t } = useLang();
  const c = useColors();
  const queryClient = useQueryClient();
  
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const [addModal, setAddModal] = useState(false);
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mRole, setMRole] = useState('');
  
  const [editModal, setEditModal] = useState(false);
  const [eName, setEName] = useState('');
  const [eShort, setEShort] = useState('');

  const q = useQuery({
    queryKey: ['community-team', teamId],
    queryFn: () => communityGetTeam(token as string, teamId),
    enabled: !!token,
  });

  const isOwner = token && q.data?.team && q.data.team.ownerUserId === user?.id;

  const updateMut = useMutation({
    mutationFn: (data: any) => communityUpdateTeam(token as string, teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-team', teamId] });
      setEditModal(false);
    },
    onError: (err: any) => alert(err.message || 'Error updating team'),
  });

  const delMut = useMutation({
    mutationFn: () => communityDeleteTeam(token as string, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-teams'] });
      router.back();
    },
    onError: (err: any) => alert(err.message || 'Error deleting team'),
  });

  const addMemMut = useMutation({
    mutationFn: (data: any) => communityAddMember(token as string, teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-team', teamId] });
      setAddModal(false);
      setMName('');
      setMPhone('');
      setMRole('');
    },
    onError: (err: any) => alert(err.message || 'Error adding member'),
  });

  const remMemMut = useMutation({
    mutationFn: (memberId: string) => communityRemoveMember(token as string, teamId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-team', teamId] }),
    onError: (err: any) => alert(err.message || 'Error removing member'),
  });

  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);

  if (!ready || q.isLoading) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('Team', 'टीम')} back={true} /><LoadingView /></View>;
  }

  if (q.isError) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenBackground /><GlassAppBar title={t('Team', 'टीम')} back={true} /><ErrorView onRetry={() => q.refetch()} /></View>;
  }

  const team = q.data?.team;
  const members = q.data?.members || [];

  const handleEditOpen = () => {
    setEName(team!.name);
    setEShort(team!.shortName);
    setEditModal(true);
  };

  const confirmDelete = () => {
    Alert.alert(t('Delete Team', 'टीम डिलीट करें'), t('Are you sure you want to delete this team?', 'क्या आप वाकई इस टीम को डिलीट करना चाहते हैं?'), [
      { text: t('Cancel', 'रद्द करें'), style: 'cancel' },
      { text: t('Delete', 'डिलीट करें'), style: 'destructive', onPress: () => delMut.mutate() }
    ]);
  };

  const handleMediaUpload = async (slot: 'logo' | 'cover') => {
    if (!token || !isOwner) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: slot === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });
      if (res.canceled || !res.assets[0]) return;
      const asset = res.assets[0];
      setUploading(slot);
      
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      
      const { presignedUrl, s3Key } = await communityTeamMediaPresign(token, teamId, slot, blob.type || 'image/jpeg', blob.size);
      await putToPresignedUrl(presignedUrl, blob, blob.type || 'image/jpeg');
      await communityTeamMediaConfirm(token, teamId, slot, s3Key);
      queryClient.invalidateQueries({ queryKey: ['communityTeam', token, teamId] });
      queryClient.invalidateQueries({ queryKey: ['communityTeams', token] });
    } catch (e: any) {
      alert(e.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={team?.shortName || t('Team', 'टीम')} back={true} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: bottomNavHeight + 40, paddingTop: appBarHeight }}>
        <View style={{ padding: 16, gap: 16 }}>
          
          <Card padding={0} style={{ overflow: 'hidden' }}>
              <Pressable onPress={() => handleMediaUpload('cover')} style={{ height: 120, backgroundColor: c.card2, position: 'relative' }}>
                {team?.coverUrl ? (
                  <Image source={{ uri: team.coverUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <LinearGradient colors={[`${c.cyan}20`, `${c.cyan}10`]} style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' }}>
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
                <Pressable onPress={() => handleMediaUpload('logo')} style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.cyan, borderWidth: 4, borderColor: c.card, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {team?.logoUrl ? (
                    <Image source={{ uri: team.logoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <Text style={{ color: c.bg, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 32 }}>
                      {team?.shortName}
                    </Text>
                  )}
                  {uploading === 'logo' && (
                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                </Pressable>
              </View>

              <View style={{ padding: 24, paddingTop: 16, alignItems: 'center' }}>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginBottom: 4 }}>
                {team?.name}
              </Text>
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
                {members.length} {t('Members', 'सदस्य')}
              </Text>
              {isOwner && (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <Pressable onPress={handleEditOpen} style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: c.card2, borderWidth: 1, borderColor: c.line }}>
                    <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
                      {t('Edit', 'एडिट')}
                    </Text>
                  </Pressable>
                  <Pressable onPress={confirmDelete} style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: `${c.coral}15`, borderWidth: 1, borderColor: c.coral }}>
                    <Text style={{ color: c.coral, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
                      {t('Delete', 'डिलीट')}
                    </Text>
                  </Pressable>
                </View>
              )}
              </View>
          </Card>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18 }}>
              {t('Roster', 'रोस्टर')}
            </Text>
            {isOwner && (
              <Pressable onPress={() => setAddModal(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${c.violet}20`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                <Feather name="plus" size={14} color={c.violet} />
                <Text style={{ color: c.violet, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>
                  {t('Add Player', 'खिलाड़ी जोड़ें')}
                </Text>
              </Pressable>
            )}
          </View>

          {members.length === 0 ? (
            <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Feather name="user-x" size={32} color={c.sub} style={{ marginBottom: 12 }} />
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15 }}>
                {t('No players added yet.', 'अभी कोई खिलाड़ी नहीं है।')}
              </Text>
            </Card>
          ) : (
            <Card padding={0}>
              {members.map((m, i) => (
                <View key={m.id} style={[{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card2, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>
                      {m.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>
                        {m.name}
                      </Text>
                      {m.userId && (
                        <View style={{ backgroundColor: `${c.cyan}20`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                          <Feather name="check" size={10} color={c.cyan} />
                        </View>
                      )}
                    </View>
                    <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, marginTop: 2 }}>
                      {m.role || t('Player', 'खिलाड़ी')}{m.phoneMasked ? ` · ${m.phoneMasked}` : ''}
                    </Text>
                  </View>
                  {isOwner && (
                    <Pressable onPress={() => {
                      Alert.alert(t('Remove Player', 'खिलाड़ी हटाएं'), t(`Remove ${m.name}?`, `क्या आप ${m.name} को हटाना चाहते हैं?`), [
                        { text: t('Cancel', 'रद्द करें'), style: 'cancel' },
                        { text: t('Remove', 'हटाएं'), style: 'destructive', onPress: () => remMemMut.mutate(m.id) }
                      ]);
                    }} style={{ padding: 8 }}>
                      <Feather name="trash-2" size={16} color={c.coral} />
                    </Pressable>
                  )}
                </View>
              ))}
            </Card>
          )}

        </View>
      </ScrollView>

      {/* EDIT TEAM MODAL */}
      <Modal visible={editModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: c.bg, borderColor: c.line, borderWidth: 1 }]}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 16 }}>
              {t('Edit Team', 'टीम एडिट करें')}
            </Text>
            
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
              {t('Team Name', 'टीम का नाम')}
            </Text>
            <TextInput
              value={eName}
              onChangeText={setEName}
              style={[styles.input, { backgroundColor: c.card, color: c.ink, borderColor: c.line, marginBottom: 16 }]}
            />

            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
              {t('Short Name', 'छोटा नाम')}
            </Text>
            <TextInput
              value={eShort}
              onChangeText={(v) => setEShort(v.toUpperCase())}
              maxLength={5}
              style={[styles.input, { backgroundColor: c.card, color: c.ink, borderColor: c.line, marginBottom: 24 }]}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => setEditModal(false)} style={[styles.modalBtn, { backgroundColor: c.card2 }]}>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Cancel', 'रद्द करें')}</Text>
              </Pressable>
              <Pressable
                onPress={() => updateMut.mutate({ name: eName.trim(), shortName: eShort.trim() })}
                disabled={updateMut.isPending}
                style={[styles.modalBtn, { backgroundColor: c.cyan }]}
              >
                {updateMut.isPending ? <ActivityIndicator size="small" color={c.bg} /> : (
                  <Text style={{ color: c.bg, fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Save', 'सेव करें')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD MEMBER MODAL */}
      <Modal visible={addModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: c.bg, borderColor: c.line, borderWidth: 1 }]}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginBottom: 16 }}>
              {t('Add Player', 'खिलाड़ी जोड़ें')}
            </Text>
            
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
              {t('Player Name', 'खिलाड़ी का नाम')}
            </Text>
            <TextInput
              value={mName}
              onChangeText={setMName}
              placeholder={t('e.g. Rahul K', 'जैसे राहुल के')}
              placeholderTextColor={c.sub}
              style={[styles.input, { backgroundColor: c.card, color: c.ink, borderColor: c.line, marginBottom: 16 }]}
            />

            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
              {t('Phone (Optional - links profile)', 'फ़ोन (प्रोफ़ाइल लिंक करने के लिए)')}
            </Text>
            <TextInput
              value={mPhone}
              onChangeText={setMPhone}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              placeholderTextColor={c.sub}
              style={[styles.input, { backgroundColor: c.card, color: c.ink, borderColor: c.line, marginBottom: 16 }]}
            />

            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 8 }}>
              {t('Role (Optional)', 'भूमिका (वैकल्पिक)')}
            </Text>
            <TextInput
              value={mRole}
              onChangeText={setMRole}
              placeholder={t('e.g. Batsman', 'जैसे बल्लेबाज़')}
              placeholderTextColor={c.sub}
              style={[styles.input, { backgroundColor: c.card, color: c.ink, borderColor: c.line, marginBottom: 24 }]}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => setAddModal(false)} style={[styles.modalBtn, { backgroundColor: c.card2 }]}>
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Cancel', 'रद्द करें')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!mName.trim()) return alert(t('Name is required', 'नाम दर्ज करें'));
                  addMemMut.mutate({ name: mName.trim(), phone: mPhone.trim() || undefined, role: mRole.trim() || undefined });
                }}
                disabled={addMemMut.isPending}
                style={[styles.modalBtn, { backgroundColor: c.violet }]}
              >
                {addMemMut.isPending ? <ActivityIndicator size="small" color="#fff" /> : (
                  <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Add', 'जोड़ें')}</Text>
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
