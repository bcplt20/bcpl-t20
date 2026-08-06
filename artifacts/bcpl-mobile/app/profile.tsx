import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import {
  getDashboard,
  setAvatarPreset,
  getAvatarUploadUrl,
  confirmAvatarUpload,
  putToPresignedUrl,
  type Avatar,
} from '@/lib/api';
import { AVATAR_PRESETS } from '@/lib/avatars';
import { AvatarCircle } from '@/components/AvatarCircle';
import {
  Card,
  ErrorView,
  LoadingView,
  GlassAppBar,
  ScreenBackground,
  useAppBarHeight,
} from '@/components/ui';

// Player details screen — mirrors the website profile: Name, Phone, Email,
// Trial city, Registration number, Role, Age, Season. Data comes from the same
// /user/dashboard endpoint the More tab uses. Players can also set an avatar
// (upload a photo or pick a preset icon).
export default function ProfileDetailsScreen() {
  const c = useColors();
  const { token, user, ready } = useAuth();
  const { t } = useLang();
  const appBarHeight = useAppBarHeight();
  const qc = useQueryClient();

  const [showChooser, setShowChooser] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const dashQ = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => getDashboard(token as string),
    enabled: !!token,
  });

  if (!ready) return <LoadingView />;

  const d = dashQ.data;
  const reg = d?.registration;
  const avatar = d?.avatar ?? null;

  const applyAvatar = (a: Avatar | null) => {
    // Optimistically update the cached dashboard so both this screen and the
    // More tab header reflect the new avatar immediately.
    qc.setQueryData(['dashboard', token], (prev: typeof d) => (prev ? { ...prev, avatar: a } : prev));
  };

  const onPickPreset = async (id: string) => {
    if (!token) return;
    setSavingAvatar(true);
    try {
      const r = await setAvatarPreset(token, id);
      applyAvatar(r.avatar);
      setShowChooser(false);
    } catch {
      Alert.alert(t('Could not update avatar', 'अवतार अपडेट नहीं हो सका'));
    } finally {
      setSavingAvatar(false);
    }
  };

  const onUploadPhoto = async () => {
    if (!token) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        t('Permission needed', 'अनुमति चाहिए'),
        t('Allow photo access to upload a picture.', 'तस्वीर अपलोड करने के लिए फ़ोटो एक्सेस दें।'),
      );
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setSavingAvatar(true);
    try {
      const resp = await fetch(asset.uri);
      const blob = await resp.blob();
      const contentType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
      const { presignedUrl } = await getAvatarUploadUrl(token, contentType, blob.size || 1);
      await putToPresignedUrl(presignedUrl, blob, contentType);
      const r = await confirmAvatarUpload(token);
      applyAvatar(r.avatar);
      setShowChooser(false);
    } catch {
      Alert.alert(t('Upload failed', 'अपलोड विफल'), t('Please try again.', 'कृपया फिर कोशिश करें।'));
    } finally {
      setSavingAvatar(false);
    }
  };

  const ageValue =
    reg?.age != null
      ? t(`${reg.age} years`, `${reg.age} वर्ष`)
      : '—';

  const rows: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string }[] = [
    { icon: 'user', label: t('Full Name', 'पूरा नाम'), value: user?.name || '—' },
    { icon: 'phone', label: t('Phone', 'फ़ोन'), value: user?.phone ? `+91 ${user.phone.replace(/^\+?91/, '')}` : '—' },
    { icon: 'mail', label: t('Email', 'ईमेल'), value: user?.email || t('Not provided', 'नहीं दिया गया') },
    { icon: 'gift', label: t('Age', 'उम्र'), value: ageValue },
    { icon: 'hash', label: t('Registration No.', 'रजिस्ट्रेशन नं.'), value: reg?.regNumber || '—' },
    { icon: 'award', label: t('Role', 'रोल'), value: reg?.role || '—' },
    { icon: 'map-pin', label: t('Trial City', 'ट्रायल शहर'), value: reg?.trialCity || '—' },
    { icon: 'calendar', label: t('Season', 'सीज़न'), value: '5 · 2025–26' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('Profile', 'प्रोफ़ाइल')} back={true} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: appBarHeight + 16, paddingBottom: 40 }}
      >
        {dashQ.isLoading ? (
          <LoadingView />
        ) : dashQ.isError ? (
          <ErrorView onRetry={() => dashQ.refetch()} />
        ) : (
          <>
            {/* Header identity block */}
            <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Pressable onPress={() => setShowChooser(true)} testID="avatar-edit" style={{ alignItems: 'center' }}>
                <View>
                  <AvatarCircle avatar={avatar} size={96} />
                  <View style={[styles.editBadge, { backgroundColor: c.magenta, borderColor: c.bg }]}>
                    <Feather name="camera" size={14} color="#fff" />
                  </View>
                </View>
                <Text style={{ color: c.getAccentText(c.magenta), fontSize: 13, marginTop: 10, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {t('Change photo', 'फ़ोटो बदलें')}
                </Text>
              </Pressable>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, marginTop: 14, textAlign: 'center' }}>
                {user?.name || t('Player', 'खिलाड़ी')}
              </Text>
              {reg?.regNumber ? (
                <Text style={{ color: c.getAccentText(c.cyan), fontSize: 14, marginTop: 6, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.5 }}>
                  {reg.regNumber}
                </Text>
              ) : null}
            </Card>

            {/* Detail rows */}
            <Card style={{ padding: 0, marginTop: 16 }}>
              <View style={{ padding: 20, paddingBottom: 8 }}>
                <Text style={[styles.cardTitle, { color: c.ink }]}>{t('Your details', 'आपकी जानकारी')}</Text>
              </View>
              <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
                {rows.map((row, i) => (
                  <View
                    key={row.label}
                    style={[
                      styles.detailRow,
                      i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
                    ]}
                  >
                    <View style={[styles.detailIcon, { backgroundColor: c.card2, borderColor: c.line }]}>
                      <Feather name={row.icon} size={16} color={c.getAccentText(c.magenta)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.4, marginBottom: 3 }}>
                        {row.label}
                      </Text>
                      <Text style={{ color: c.ink, fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                        {row.value}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Avatar chooser sheet */}
      <Modal visible={showChooser} transparent animationType="fade" onRequestClose={() => setShowChooser(false)}>
        <Pressable style={styles.scrim} onPress={() => (savingAvatar ? null : setShowChooser(false))}>
          <Pressable style={[styles.sheet, { backgroundColor: c.card, borderColor: c.line }]} onPress={(e) => e.stopPropagation()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18 }}>
                {t('Choose avatar', 'अवतार चुनें')}
              </Text>
              <Pressable onPress={() => setShowChooser(false)} disabled={savingAvatar} hitSlop={10}>
                <Feather name="x" size={22} color={c.sub} />
              </Pressable>
            </View>

            <Pressable
              onPress={onUploadPhoto}
              disabled={savingAvatar}
              style={({ pressed }) => [styles.uploadBtn, { opacity: pressed || savingAvatar ? 0.7 : 1 }]}
              testID="avatar-upload"
            >
              <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Feather name="upload" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }}>
                {t('Upload photo', 'फ़ोटो अपलोड करें')}
              </Text>
            </Pressable>

            <Text style={{ color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.5, marginTop: 20, marginBottom: 12 }}>
              {t('OR PICK A PRESET', 'या एक प्रीसेट चुनें')}
            </Text>
            <View style={styles.presetGrid}>
              {AVATAR_PRESETS.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => onPickPreset(p.id)}
                  disabled={savingAvatar}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  testID={`avatar-preset-${p.id}`}
                >
                  <View style={styles.presetCircle}>
                    <LinearGradient colors={p.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 28 }]} />
                    <Feather name={p.icon} size={24} color="#fff" />
                  </View>
                </Pressable>
              ))}
            </View>

            {savingAvatar ? (
              <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <ActivityIndicator color={c.magenta} />
                <Text style={{ color: c.sub, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Saving…', 'सहेजा जा रहा है…')}</Text>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18 },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 15,
    overflow: 'hidden',
  },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  presetCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
