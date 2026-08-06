import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { roleLabel, canonicalRole } from '@/lib/roleLabel';
import { queryClient } from '@/lib/queryClient';
import {
  ApiError,
  confirmVideoUpload,
  getDashboard,
  getVideoInstructions,
  getVideoUploadUrl,
  type VideoConstraints,
} from '@/lib/api';
import {
  Card,
  ErrorView,
  LoadingView,
  ScreenBackground,
  GlassAppBar,
  useAppBarHeight,
} from '@/components/ui';

/* Role metadata — mirrors the website Phase1VideoUpload ROLE_META. */
const ROLE_META: Record<string, { label: string; req: { en: string; hi: string }; tips: { en: string; hi: string }[] }> = {
  bat: {
    label: 'Batsman',
    req: { en: 'Show 3+ strokes: drives, pulls & sweeps', hi: '3+ शॉट दिखाएँ: ड्राइव, पुल और स्वीप' },
    tips: [
      { en: 'Cover drive off front foot', hi: 'फ्रंट फुट पर कवर ड्राइव' },
      { en: 'Pull shot to leg side', hi: 'लेग साइड पर पुल शॉट' },
      { en: 'Reverse or conventional sweep', hi: 'रिवर्स या सामान्य स्वीप' },
    ],
  },
  bowl: {
    label: 'Bowler',
    req: { en: '5+ deliveries — mix pace & swing', hi: '5+ गेंदें — गति और स्विंग का मिश्रण' },
    tips: [
      { en: 'Outswinger & inswinger pair', hi: 'आउटस्विंगर और इनस्विंगर जोड़ी' },
      { en: 'Yorker delivery', hi: 'यॉर्कर गेंद' },
      { en: 'Change of pace ball', hi: 'गति में बदलाव वाली गेंद' },
    ],
  },
  wk: {
    label: 'Wicket-Keeper',
    req: { en: '3+ takes & stumpings, glove work', hi: '3+ कैच और स्टंपिंग, ग्लव वर्क' },
    tips: [
      { en: 'Caught behind the stumps', hi: 'स्टंप के पीछे कैच' },
      { en: 'Quick stumping drill', hi: 'तेज़ स्टंपिंग ड्रिल' },
      { en: 'Wide ball diving take', hi: 'वाइड गेंद पर डाइविंग कैच' },
    ],
  },
  ar: {
    label: 'All-Rounder',
    req: { en: '2 min split — 1 min bat + 1 min bowl', hi: '2 मिनट — 1 मिनट बैटिंग + 1 मिनट बॉलिंग' },
    tips: [
      { en: 'Batting first half', hi: 'पहला भाग बैटिंग' },
      { en: 'Bowling second half', hi: 'दूसरा भाग बॉलिंग' },
      { en: 'Clear scene transitions', hi: 'साफ़ ट्रांज़िशन' },
    ],
  },
};

const ALLOWED_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/webm': 'webm',
};

function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Friendly copy for server-side validation failure reasons. Mirrors website REUPLOAD_COPY. */
const REUPLOAD_COPY: Record<string, { en: string; hi: string }> = {
  VIDEO_TOO_SHORT: { en: 'Your video was too short. Please upload at least 30 seconds of cricket footage.', hi: 'आपका वीडियो बहुत छोटा था। कृपया कम से कम 30 सेकंड की क्रिकेट फुटेज अपलोड करें।' },
  VIDEO_TOO_LONG: { en: 'Your video was longer than the 90-second limit. Please upload a shorter video.', hi: 'आपका वीडियो 90 सेकंड की सीमा से लंबा था। कृपया छोटा वीडियो अपलोड करें।' },
  CORRUPTED_VIDEO: { en: 'We could not read your video file. Please record again in MP4 or MOV format.', hi: 'हम आपकी वीडियो फ़ाइल नहीं पढ़ सके। कृपया MP4 या MOV फॉर्मेट में दोबारा रिकॉर्ड करें।' },
  REUPLOAD_REQUIRED: { en: 'We could not process your last upload. Please upload a new video.', hi: 'हम आपका पिछला अपलोड प्रोसेस नहीं कर सके। कृपया नया वीडियो अपलोड करें।' },
  NOT_CRICKET_VIDEO: { en: 'The footage does not clearly show cricket play. Please upload a genuine cricket video.', hi: 'फुटेज में क्रिकेट खेलते हुए साफ़ नहीं दिख रहा। कृपया असली क्रिकेट वीडियो अपलोड करें।' },
  PLAYER_NOT_VISIBLE: { en: 'You are not clearly visible in the video. Keep your full body in frame.', hi: 'वीडियो में आप साफ़ नहीं दिख रहे। पूरा शरीर फ्रेम में रखें।' },
  INSUFFICIENT_ACTIONS: { en: 'Not enough cricket actions to assess. Show more shots or deliveries.', hi: 'आकलन के लिए पर्याप्त क्रिकेट एक्शन नहीं। और शॉट या डिलीवरी दिखाएं।' },
  VIDEO_TOO_DARK: { en: 'The video is too dark to assess clearly. Please record in better light.', hi: 'वीडियो बहुत अंधेरा है। कृपया बेहतर रोशनी में रिकॉर्ड करें।' },
};

type Phase =
  | 'loading' | 'not_registered' | 'deadline_passed' | 'already_uploaded'
  | 'error' | 'idle' | 'file_selected' | 'uploading' | 'confirming' | 'success';

interface Picked { uri: string; name: string; size: number; type: string; duration: number | null }

function getDaysLeft(deadline?: string | null): number {
  if (!deadline) return 0;
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

export default function UploadVideoScreen() {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const { token, ready } = useAuth();
  const appBarHeight = useAppBarHeight();

  const [phase, setPhase] = useState<Phase>('loading');
  const [errMsg, setErrMsg] = useState('');
  const [fileErr, setFileErr] = useState('');
  const [regId, setRegId] = useState('');
  const [role, setRole] = useState('bat');
  const [deadline, setDeadline] = useState<string | null>(null);
  const [constraints, setConstraints] = useState<VideoConstraints | null>(null);
  const [instr, setInstr] = useState<{ en: string[]; hi: string[] } | null>(null);
  const [reuploadReason, setReuploadReason] = useState<string | null>(null);

  const [picked, setPicked] = useState<Picked | null>(null);
  const [declAccepted, setDeclAccepted] = useState(false);
  const [progress, setProgress] = useState(0);

  // We need the dashboard for gating (paid + phase1Status) — the same source of
  // truth the Journey screen uses, so an unpaid user can never land here.
  const dq = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => getDashboard(token as string),
    enabled: !!token,
  });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      // Filming instructions + upload constraints (role-specific, admin-configurable).
      try {
        const vi = await getVideoInstructions(token);
        if (!cancelled) { setConstraints(vi.constraints); if (vi.instructions) setInstr(vi.instructions); }
      } catch { /* fall back to built-in defaults */ }
    })();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!dq.data) return;
    const d = dq.data;
    const reg = d.registration;
    if (!d.registered || !reg) { setPhase('not_registered'); return; }
    const p1 = reg.phase1Status ?? '';
    // Must have paid Phase 1 before uploading (mirrors website guard: 'pending' → blocked).
    const paid = (d.phase1Payment && ['success', 'paid'].includes(d.phase1Payment.status))
      || ['payment_done', 'video_submitted', 'selected', 'rejected'].includes(p1);
    if (!paid) { setPhase('not_registered'); return; }

    setRegId(reg.id);
    setRole(reg.role ?? 'bat');
    setDeadline(reg.videoDeadline ?? null);

    if (d.video?.submitted || ['video_submitted', 'selected', 'rejected'].includes(p1)) {
      setReuploadReason(d.video?.status && d.video.status !== 'pending' && d.video.status !== 'approved' ? d.video.status : null);
      setPhase('already_uploaded');
      return;
    }
    if (reg.deadlineExpired || (getDaysLeft(reg.videoDeadline) === 0 && reg.videoDeadline)) {
      setPhase('deadline_passed');
      return;
    }
    setPhase((prev) => (prev === 'loading' || prev === 'not_registered' ? 'idle' : prev));
  }, [dq.data]);

  const minSec = constraints?.videoMinSeconds ?? 30;
  const maxSec = constraints?.videoMaxSeconds ?? 60;
  const maxMb = constraints?.maxVideoFileSizeMb ?? 200;
  // Historic long role codes (e.g. wicketkeeper_batsman) must resolve to the
  // right instructional meta, not silently fall back to Batsman.
  const roleMeta = ROLE_META[canonicalRole(role)] ?? ROLE_META.bat;

  const pickVideo = useCallback(async () => {
    setFileErr('');
    setErrMsg('');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setFileErr(t('Please allow access to your videos to continue.', 'जारी रखने के लिए कृपया अपने वीडियो का एक्सेस दें।'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const a = result.assets[0];
    const type = a.mimeType ?? 'video/mp4';
    if (!ALLOWED_MIME[type]) {
      setFileErr(t('Invalid format. Please choose an MP4, MOV, AVI or WebM video.', 'अमान्य फॉर्मेट। कृपया MP4, MOV, AVI या WebM वीडियो चुनें।'));
      return;
    }
    const size = a.fileSize ?? 0;
    if (size && size > maxMb * 1024 * 1024) {
      setFileErr(t(`File too large (${fmtSize(size)}). Max ${maxMb} MB.`, `फ़ाइल बहुत बड़ी है (${fmtSize(size)})। अधिकतम ${maxMb} MB.`));
      return;
    }
    // expo-image-picker gives duration in milliseconds for videos.
    const durSec = a.duration != null ? Math.round(a.duration / 1000) : null;
    if (durSec != null && (durSec < minSec - 1 || durSec > maxSec + 1)) {
      setFileErr(t(
        `Video must be ${minSec}–${maxSec} seconds. Yours is ${durSec}s — please trim or re-record.`,
        `वीडियो ${minSec}–${maxSec} सेकंड का होना चाहिए। आपका ${durSec} सेकंड का है — कृपया छोटा करें या दोबारा रिकॉर्ड करें।`,
      ));
      return;
    }
    setPicked({ uri: a.uri, name: a.fileName ?? `trial.${ALLOWED_MIME[type]}`, size, type, duration: durSec });
    setDeclAccepted(false);
    setPhase('file_selected');
  }, [t, maxMb, minSec, maxSec]);

  const submit = useCallback(async () => {
    if (!picked || !regId || !token) return;
    setErrMsg('');
    setProgress(0);
    setPhase('uploading');
    try {
      // Step 1: presigned URL from our API.
      const { presignedUrl, s3Key } = await getVideoUploadUrl(token, regId, picked.type, picked.size || undefined);

      // Step 2: read the local file into a blob and PUT it straight to S3.
      setProgress(20);
      const fileRes = await fetch(picked.uri);
      const blob = await fileRes.blob();
      setProgress(45);
      const putRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': picked.type },
        body: blob,
      });
      if (!putRes.ok) throw new Error(`Upload failed (${putRes.status})`);
      setProgress(90);

      // Step 3: confirm with our API (validates object server-side).
      setPhase('confirming');
      await confirmVideoUpload(token, regId, s3Key, true, picked.duration ?? undefined);
      setProgress(100);

      // The dashboard changed — invalidate so Journey shows "under review".
      queryClient.invalidateQueries({ queryKey: ['dashboard', token] });
      setPhase('success');
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : (e?.message ?? t('Upload failed. Please try again.', 'अपलोड विफल रहा। कृपया पुनः प्रयास करें।'));
      setErrMsg(msg);
      setPhase('file_selected');
    }
  }, [picked, regId, token, t]);

  if (!ready) return <LoadingView />;

  const Header = (
    <>
      <ScreenBackground />
      <GlassAppBar title={t('Upload Video', 'वीडियो अपलोड')} back={true} />
    </>
  );

  if (!token) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {Header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: appBarHeight }}>
          <Feather name="lock" size={28} color={c.magenta} />
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
            {t('Log in to upload your trial video', 'अपना ट्रायल वीडियो अपलोड करने के लिए लॉगिन करें')}
          </Text>
        </View>
      </View>
    );
  }

  if (phase === 'loading' || dq.isLoading) return (<View style={{ flex: 1, backgroundColor: c.bg }}>{Header}<LoadingView /></View>);
  if (dq.isError && !dq.data) return (<View style={{ flex: 1, backgroundColor: c.bg }}>{Header}<ErrorView onRetry={() => dq.refetch()} /></View>);

  const cd = getDaysLeft(deadline);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {Header}
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: appBarHeight + 8, paddingBottom: 60 }}>
        {/* Title */}
        <LinearGradient colors={['#5B2BF0', '#9B2FF0', '#FF3DA6']} style={{ width: 48, height: 4, borderRadius: 2, marginBottom: 12 }} />
        <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 28, color: c.ink, letterSpacing: -0.5 }}>
          {t('Upload Trial Video', 'ट्रायल वीडियो अपलोड')}
        </Text>
        <Text style={{ color: c.sub, fontSize: 14, marginTop: 6, fontFamily: 'PlusJakartaSans_500Medium' }}>
          {t('Your video is your ticket to the ground trials.', 'आपका वीडियो ग्राउंड ट्रायल्स के लिए आपका टिकट है।')}
        </Text>

        {/* Full-page states */}
        {phase === 'not_registered' ? (
          <Card style={{ marginTop: 24, alignItems: 'center', paddingVertical: 32 }}>
            <Feather name="shield" size={28} color={c.amber} />
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 14, textAlign: 'center' }}>
              {t('Complete Phase 1 payment first', 'पहले फेज 1 भुगतान पूरा करें')}
            </Text>
            <Text style={{ color: c.sub, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' }}>
              {t('You need to pay the Phase 1 fee before uploading your trial video.', 'अपना ट्रायल वीडियो अपलोड करने से पहले आपको फेज 1 फीस भरनी होगी।')}
            </Text>
            <Pressable onPress={() => router.replace('/register')} style={({ pressed }) => [styles.btn, { marginTop: 20, opacity: pressed ? 0.85 : 1 }]}>
              <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14 }}>{t('Go to registration', 'रजिस्ट्रेशन पर जाएँ')}</Text>
            </Pressable>
          </Card>
        ) : phase === 'deadline_passed' ? (
          <Card style={{ marginTop: 24, alignItems: 'center', paddingVertical: 32 }}>
            <Feather name="clock" size={28} color={c.coral} />
            <Text style={{ color: c.coral, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 14, textAlign: 'center' }}>
              {t('Upload window closed', 'अपलोड window बंद')}
            </Text>
            <Text style={{ color: c.sub, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' }}>
              {t('Your video upload window has expired. Late submissions cannot be accepted for Phase 1 review.', 'आपकी वीडियो अपलोड window समाप्त हो गई है। फेज 1 समीक्षा के लिए देर से सबमिशन स्वीकार नहीं होते।')}
            </Text>
          </Card>
        ) : phase === 'already_uploaded' ? (
          <Card style={{ marginTop: 24, alignItems: 'center', paddingVertical: 32 }}>
            <Feather name={reuploadReason ? 'alert-triangle' : 'check-circle'} size={30} color={reuploadReason ? c.amber : c.mint} />
            <Text style={{ color: reuploadReason ? c.amber : c.mint, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 14, textAlign: 'center' }}>
              {reuploadReason ? t('We need a new upload', 'हमें नया अपलोड चाहिए') : t('Video already submitted!', 'वीडियो पहले ही सबमिट हो गया!')}
            </Text>
            <Text style={{ color: c.sub, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' }}>
              {reuploadReason
                ? t(REUPLOAD_COPY[reuploadReason]?.en ?? REUPLOAD_COPY.REUPLOAD_REQUIRED.en, REUPLOAD_COPY[reuploadReason]?.hi ?? REUPLOAD_COPY.REUPLOAD_REQUIRED.hi)
                : t('Your Phase 1 submission is going through evaluation. Result within 15 days via SMS, WhatsApp and email.', 'आपका फेज 1 सबमिशन मूल्यांकन में है। परिणाम 15 दिनों के भीतर SMS, WhatsApp और ईमेल से मिलेगा।')}
            </Text>
            <Pressable onPress={() => router.replace('/journey')} style={({ pressed }) => [styles.btn, { marginTop: 20, opacity: pressed ? 0.85 : 1 }]}>
              <LinearGradient colors={['#16E0A3', '#00B8D9']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14 }}>{t('Back to my journey', 'मेरे सफ़र पर वापस')}</Text>
            </Pressable>
          </Card>
        ) : phase === 'success' ? (
          <Card style={{ marginTop: 24, alignItems: 'center', paddingVertical: 36 }}>
            <View style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <LinearGradient colors={['#16E0A3', '#00B8D9']} style={StyleSheet.absoluteFill} />
              <Feather name="check" size={40} color="#fff" />
            </View>
            <Text style={{ color: c.mint, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginTop: 18, textAlign: 'center' }}>
              {t('Video submitted!', 'वीडियो सबमिट हो गया!')}
            </Text>
            <Text style={{ color: c.sub, fontSize: 13.5, marginTop: 10, textAlign: 'center', lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium' }}>
              {t('Your trial video has been received. Result within 15 days via SMS, WhatsApp and email.', 'आपका ट्रायल वीडियो प्राप्त हो गया। परिणाम 15 दिनों के भीतर SMS, WhatsApp और ईमेल से मिलेगा।')}
            </Text>
            <Pressable onPress={() => router.replace('/journey')} style={({ pressed }) => [styles.btn, { marginTop: 22, opacity: pressed ? 0.85 : 1 }]}>
              <LinearGradient colors={['#16E0A3', '#00B8D9']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14 }}>{t('Back to my journey', 'मेरे सफ़र पर वापस')}</Text>
            </Pressable>
          </Card>
        ) : (
          /* ── Upload UI (idle / file_selected / uploading / confirming) ── */
          <>
            {/* Deadline chip */}
            {deadline ? (
              <Card style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Feather name="clock" size={16} color={cd <= 1 ? c.coral : c.getAccentText(c.amber)} />
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>
                  {cd > 0
                    ? t(`${cd} ${cd === 1 ? 'day' : 'days'} left to upload`, `अपलोड में ${cd} दिन बाकी`)
                    : t('Upload closes today', 'अपलोड आज बंद होगा')}
                </Text>
              </Card>
            ) : null}

            {/* Upload zone / progress */}
            {phase === 'uploading' || phase === 'confirming' ? (
              <Card style={{ marginTop: 16, alignItems: 'center', paddingVertical: 30 }}>
                <ActivityIndicator color={c.magenta} size="large" />
                <Text style={{ color: c.magenta, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16 }}>
                  {phase === 'confirming' ? t('Finalising…', 'अंतिम रूप…') : t(`Uploading… ${progress}%`, `अपलोड हो रहा है… ${progress}%`)}
                </Text>
                {picked ? (
                  <Text style={{ color: c.sub, fontSize: 12.5, marginTop: 6, fontFamily: 'PlusJakartaSans_500Medium' }}>
                    {picked.name} · {fmtSize(picked.size)}
                  </Text>
                ) : null}
                <View style={{ height: 6, borderRadius: 3, backgroundColor: c.card2, overflow: 'hidden', width: '100%', marginTop: 16 }}>
                  <View style={{ width: `${progress}%`, height: '100%', borderRadius: 3, backgroundColor: c.magenta }} />
                </View>
                <Text style={{ color: c.sub, fontSize: 12.5, marginTop: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                  {t('Please keep this screen open', 'कृपया यह स्क्रीन खुली रखें')}
                </Text>
              </Card>
            ) : (
              <>
                <Pressable onPress={pickVideo} style={({ pressed }) => [styles.dropzone, { borderColor: c.magenta, backgroundColor: c.card, opacity: pressed ? 0.9 : 1 }]} testID="upload-pick-video">
                  <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <LinearGradient colors={['#9B2FF0', '#FF3DA6']} style={StyleSheet.absoluteFill} />
                    <Feather name="upload" size={30} color="#fff" />
                  </View>
                  <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16 }}>
                    {t('Select trial video', 'ट्रायल वीडियो चुनें')}
                  </Text>
                  <Text style={{ color: c.sub, fontSize: 13, marginTop: 6, textAlign: 'center', fontFamily: 'PlusJakartaSans_500Medium' }}>
                    {t('Pick from your phone gallery', 'अपने फ़ोन की गैलरी से चुनें')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                    <Chip text="MP4 / MOV / AVI" c={c} />
                    <Chip text={t(`Max ${maxMb}MB`, `अधिकतम ${maxMb}MB`)} c={c} />
                    <Chip text={t(`${minSec}–${maxSec} seconds`, `${minSec}–${maxSec} सेकंड`)} c={c} accent />
                  </View>
                </Pressable>

                {fileErr ? (
                  <View style={[styles.errBox, { backgroundColor: 'rgba(255,90,110,0.1)', borderColor: 'rgba(255,90,110,0.3)' }]}>
                    <Feather name="alert-triangle" size={14} color={c.coral} />
                    <Text style={{ color: c.coral, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', flex: 1 }}>{fileErr}</Text>
                  </View>
                ) : null}
                {errMsg ? (
                  <View style={[styles.errBox, { backgroundColor: 'rgba(255,90,110,0.1)', borderColor: 'rgba(255,90,110,0.3)' }]}>
                    <Feather name="alert-triangle" size={14} color={c.coral} />
                    <Text style={{ color: c.coral, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', flex: 1 }}>{errMsg}</Text>
                  </View>
                ) : null}

                {/* Selected file + declaration + submit */}
                {phase === 'file_selected' && picked && !fileErr ? (
                  <Card style={{ marginTop: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Feather name="check-circle" size={20} color={c.mint} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: c.ink, fontSize: 13.5, fontFamily: 'PlusJakartaSans_700Bold' }} numberOfLines={1}>{picked.name}</Text>
                          <Text style={{ color: c.sub, fontSize: 12, marginTop: 3, fontFamily: 'PlusJakartaSans_500Medium' }}>
                            {picked.size ? fmtSize(picked.size) + ' · ' : ''}{picked.duration != null ? `${picked.duration}s · ` : ''}{t('Ready to upload', 'अपलोड के लिए तैयार')}
                          </Text>
                        </View>
                      </View>
                      <Pressable onPress={() => { setPicked(null); setDeclAccepted(false); setPhase('idle'); }}>
                        <Text style={{ color: c.coral, fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Remove', 'हटाएँ')}</Text>
                      </Pressable>
                    </View>

                    <Pressable onPress={() => setDeclAccepted((v) => !v)} style={[styles.declBox, { borderColor: c.line, backgroundColor: c.card2 }]}>
                      <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: declAccepted ? c.magenta : c.sub, backgroundColor: declAccepted ? c.magenta : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                        {declAccepted ? <Feather name="check" size={13} color="#fff" /> : null}
                      </View>
                      <Text style={{ color: c.sub, fontSize: 12.5, lineHeight: 19, fontFamily: 'PlusJakartaSans_500Medium', flex: 1 }}>
                        {t('I confirm this is my own recent gameplay video, unedited except basic trimming, and I understand fake or tampered videos lead to disqualification.',
                          'मैं पुष्टि करता/करती हूं कि यह मेरा अपना हालिया गेमप्ले वीडियो है, बेसिक ट्रिमिंग के अलावा बिना एडिट किया हुआ, और मैं समझता/समझती हूं कि नकली या छेड़छाड़ किए गए वीडियो से अयोग्यता हो सकती है।')}
                      </Text>
                    </Pressable>

                    <Pressable onPress={submit} disabled={!declAccepted} style={({ pressed }) => [styles.btn, { marginTop: 4, opacity: !declAccepted ? 0.45 : pressed ? 0.85 : 1 }]} testID="upload-submit">
                      <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
                      <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }}>{t('Submit for evaluation', 'मूल्यांकन के लिए सबमिट करें')}</Text>
                    </Pressable>
                  </Card>
                ) : null}
              </>
            )}

            {/* Filming guidelines */}
            <Text style={{ color: c.sub, fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 1, marginTop: 28, marginBottom: 12 }}>
              {t('FILMING GUIDELINES', 'फिल्मांकन दिशानिर्देश')}
            </Text>
            <Card>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>
                {t(`For ${roleLabel(role, 'en')}`, `${roleLabel(role, 'hi')} के लिए`)}
              </Text>
              <Text style={{ color: c.magenta, fontSize: 13.5, fontFamily: 'PlusJakartaSans_700Bold', marginTop: 8 }}>
                {t(roleMeta.req.en, roleMeta.req.hi)}
              </Text>
              <View style={{ marginTop: 12, gap: 10 }}>
                {(instr
                  ? instr.en.map((en, i) => ({ en, hi: instr.hi[i] ?? en }))
                  : roleMeta.tips
                ).map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                    <Feather name="check" size={15} color={c.mint} style={{ marginTop: 2 }} />
                    <Text style={{ color: c.ink, fontSize: 13, lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium', flex: 1 }}>{t(item.en, item.hi)}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card style={{ marginTop: 12 }}>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15, marginBottom: 12 }}>
                {t('Important rules', 'महत्वपूर्ण नियम')}
              </Text>
              {[
                { en: 'Shoot horizontally (landscape mode).', hi: 'हॉरिजॉन्टल (लैंडस्केप मोड) में शूट करें।' },
                { en: 'Ensure good lighting and a stable camera.', hi: 'अच्छी रोशनी और स्थिर कैमरा सुनिश्चित करें।' },
                { en: 'No editing or background music. Raw footage only.', hi: 'कोई एडिटिंग या बैकग्राउंड म्यूजिक नहीं। केवल मूल फुटेज।' },
                { en: `Show your OWN current cricket performance, ${minSec}–${maxSec} seconds, within the deadline.`, hi: `अपना मौजूदा क्रिकेट प्रदर्शन ${minSec}–${maxSec} सेकंड का, समय-सीमा के भीतर दिखाएँ।` },
                { en: 'Invalid or unclear footage may require re-upload per BCPL rules.', hi: 'अमान्य या अस्पष्ट फुटेज के लिए BCPL नियमों के अनुसार दोबारा अपलोड ज़रूरी हो सकती है।' },
                { en: 'BCPL may use automated and technology-assisted systems to validate and assess your video.', hi: 'BCPL आपके वीडियो को जाँचने के लिए automated और technology-assisted systems का उपयोग कर सकता है।' },
                { en: 'Manipulation or impersonation leads to disqualification.', hi: 'वीडियो में छेड़छाड़ या किसी और की जगह वीडियो देने पर अयोग्यता होगी।' },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 9 }}>
                  <Text style={{ color: c.magenta, fontSize: 14, lineHeight: 19 }}>•</Text>
                  <Text style={{ color: c.sub, fontSize: 12.5, lineHeight: 19, fontFamily: 'PlusJakartaSans_500Medium', flex: 1 }}>{t(item.en, item.hi)}</Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Chip({ text, c, accent }: { text: string; c: ReturnType<typeof useColors>; accent?: boolean }) {
  return (
    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: accent ? 'rgba(255,61,166,0.4)' : c.line, backgroundColor: accent ? 'rgba(255,61,166,0.08)' : c.card2 }}>
      <Text style={{ color: accent ? c.magenta : c.sub, fontSize: 11.5, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 24, overflow: 'hidden',
  },
  dropzone: {
    marginTop: 16, borderWidth: 2, borderStyle: 'dashed', borderRadius: 20,
    paddingVertical: 36, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center',
  },
  errBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 14, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  declBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 16, marginBottom: 14,
  },
});
