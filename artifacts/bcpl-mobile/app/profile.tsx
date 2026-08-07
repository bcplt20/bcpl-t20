import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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
  patchDob,
  ApiError,
  type Avatar,
} from '@/lib/api';
import { AVATAR_PRESETS } from '@/lib/avatars';
import { roleLabel } from '@/lib/roleLabel';
import { battingSummary, bowlingSummary } from '@/lib/classification';
import { computeAge } from '@/lib/age';
import { AvatarCircle } from '@/components/AvatarCircle';
import {
  Card,
  ErrorView,
  LoadingView,
  GlassAppBar,
  ScreenBackground,
  useAppBarHeight,
} from '@/components/ui';
import { DobInput } from '@/components/DobInput';
import { ProfileBackfillCard } from '@/components/ProfileBackfillCard';

// Player details screen — mirrors the website profile: Name, Phone, Email,
// Trial city, Registration number, Role, Age, Season. Data comes from the same
// /user/dashboard endpoint the More tab uses. Players can also set an avatar
// (upload a photo or pick a preset icon).
export default function ProfileDetailsScreen() {
  const c = useColors();
  const { token, user, ready } = useAuth();
  const { t, lang } = useLang();
  const appBarHeight = useAppBarHeight();
  const qc = useQueryClient();
  const router = useRouter();

  const [showChooser, setShowChooser] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  // DOB backfill (legacy users with no dob → age shows "—").
  const [showDobForm, setShowDobForm] = useState(false);
  const [dobInput, setDobInput] = useState('');
  const [savingDob, setSavingDob] = useState(false);
  const [dobError, setDobError] = useState('');

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

  const onSaveDob = async () => {
    if (!token) return;
    const dob = dobInput.trim();
    // Client-side validation mirrors register.tsx (YYYY-MM-DD + real date + age).
    const age = computeAge(dob);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || age == null) {
      setDobError(t('Enter a valid date as YYYY-MM-DD.', 'YYYY-MM-DD के रूप में मान्य तारीख़ दर्ज करें।'));
      return;
    }
    if (age < 18 || age > 45) {
      setDobError(t('Player eligibility is 18–45 years.', 'खिलाड़ी की योग्यता 18–45 वर्ष है।'));
      return;
    }
    setSavingDob(true);
    setDobError('');
    try {
      await patchDob(token, dob);
      await dashQ.refetch(); // age now resolves from the server
      setShowDobForm(false);
      setDobInput('');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('Could not save. Please try again.', 'सहेजा नहीं जा सका। कृपया फिर कोशिश करें।');
      setDobError(msg);
    } finally {
      setSavingDob(false);
    }
  };

  const ageMissing = reg == null || reg.age == null;
  const ageValue = !ageMissing ? t(`${reg!.age} years`, `${reg!.age} वर्ष`) : '—';
  // DOB backfill is ONE-TIME and only offered to legacy paid carryover players
  // whose dob is still null (new registrants always provide dob at sign-up).
  const canAddDob = ageMissing && reg?.carryover === true && !reg?.dob;

  // The Age row is rendered specially (backfill action/form) so it is not part
  // of the generic rows list below.
  const rows: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string }[] = [
    { icon: 'user', label: t('Full Name', 'पूरा नाम'), value: user?.name || '—' },
    { icon: 'phone', label: t('Phone', 'फ़ोन'), value: user?.phone ? `+91 ${user.phone.replace(/^\+?91/, '')}` : '—' },
    { icon: 'mail', label: t('Email', 'ईमेल'), value: user?.email || t('Not provided', 'नहीं दिया गया') },
    { icon: 'hash', label: t('Registration No.', 'रजिस्ट्रेशन नं.'), value: reg?.regNumber || '—' },
    { icon: 'award', label: t('Role', 'रोल'), value: roleLabel(reg?.role, lang) },
    { icon: 'map-pin', label: t('Trial City', 'ट्रायल शहर'), value: reg?.trialCity || '—' },
    { icon: 'calendar', label: t('Season', 'सीज़न'), value: '5 · 2026–27' },
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
            <ProfileBackfillCard />
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
                {/* Age row — special: backfill action/form when dob is missing. */}
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: c.card2, borderColor: c.line }]}>
                    <Feather name="gift" size={16} color={c.getAccentText(c.magenta)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.4, marginBottom: 3 }}>
                      {t('Age', 'उम्र')}
                    </Text>
                    {!ageMissing ? (
                      <Text style={{ color: c.ink, fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                        {ageValue}
                      </Text>
                    ) : !canAddDob ? (
                      <Text style={{ color: c.ink, fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                        {ageValue}
                      </Text>
                    ) : !showDobForm ? (
                      <Pressable onPress={() => { setShowDobForm(true); setDobError(''); }} hitSlop={6} testID="profile-add-dob">
                        <Text style={{ color: c.getAccentText(c.cyan), fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', textDecorationLine: 'underline' }}>
                          {t('Add date of birth', 'जन्मतिथि जोड़ें')}
                        </Text>
                      </Pressable>
                    ) : (
                      <View style={{ marginTop: 4 }}>
                        <DobInput value={dobInput} onChange={(v) => { setDobInput(v); if (dobError) setDobError(''); }} error={dobError} />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                          <Pressable
                            onPress={onSaveDob}
                            disabled={savingDob}
                            style={({ pressed }) => [styles.dobSaveBtn, { opacity: pressed || savingDob ? 0.7 : 1 }]}
                            testID="profile-dob-save"
                          >
                            <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 10 }]} />
                            {savingDob ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14 }}>
                                {t('Save', 'सहेजें')}
                              </Text>
                            )}
                          </Pressable>
                          <Pressable
                            onPress={() => { setShowDobForm(false); setDobError(''); setDobInput(''); }}
                            disabled={savingDob}
                            style={({ pressed }) => [styles.dobCancelBtn, { borderColor: c.line, opacity: pressed ? 0.7 : 1 }]}
                          >
                            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 }}>
                              {t('Cancel', 'रद्द करें')}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
                {rows.map((row) => (
                  <View
                    key={row.label}
                    style={[
                      styles.detailRow,
                      { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
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

            {/* Playing style (classification) — ONE-TIME. Only legacy paid
                carryover players who have NOT set it yet get a one-time "Add"
                link; everyone else sees it read-only (they set it once inside
                the registration → video flow). */}
            {reg ? (() => {
              const cls = reg.classification ?? null;
              const bat = cls ? battingSummary(reg.role, cls, lang) : null;
              const bowl = cls ? bowlingSummary(cls, lang) : null;
              const lines: { label: string; value: string }[] = [];
              if (bat) lines.push({ label: t('Batting', 'बल्लेबाज़ी'), value: bat });
              if (bowl) lines.push({ label: t('Bowling', 'गेंदबाज़ी'), value: bowl });
              const canAdd = reg.carryover === true && lines.length === 0;
              return (
                <Card style={{ padding: 0, marginTop: 16 }}>
                  <View style={{ padding: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.cardTitle, { color: c.ink }]}>{t('Playing style', 'खेल शैली')}</Text>
                    {canAdd ? (
                      <Pressable onPress={() => router.push('/classification')} hitSlop={8} testID="profile-add-classification">
                        <Text style={{ color: c.getAccentText(c.cyan), fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', textDecorationLine: 'underline' }}>
                          {t('Add', 'जोड़ें')}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
                    {lines.length ? lines.map((ln, i) => (
                      <View
                        key={ln.label}
                        style={[styles.detailRow, i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line } : null]}
                      >
                        <View style={[styles.detailIcon, { backgroundColor: c.card2, borderColor: c.line }]}>
                          <Feather name="activity" size={16} color={c.getAccentText(c.magenta)} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.4, marginBottom: 3 }}>
                            {ln.label}
                          </Text>
                          <Text style={{ color: c.ink, fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                            {ln.value}
                          </Text>
                        </View>
                      </View>
                    )) : (
                      <Text style={{ color: c.sub, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', paddingBottom: 12 }}>
                        {t('Not set yet.', 'अभी सेट नहीं है।')}
                      </Text>
                    )}
                  </View>
                </Card>
              );
            })() : null}
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
  dobSaveBtn: {
    minWidth: 92,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dobCancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
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
