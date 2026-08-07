import React, { useEffect, useState, useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { queryClient } from '@/lib/queryClient';
import {
  ApiError,
  getDashboard,
  getKycProgress,
  initiateKyc,
  kycAadhaarOtp,
  kycVerifyPan,
  verifyKycOtp,
} from '@/lib/api';
import {
  Card,
  ErrorView,
  LoadingView,
  ScreenBackground,
  GlassAppBar,
  useAppBarHeight,
} from '@/components/ui';

// Must match backend PROFESSIONS enum (kyc.ts) exactly.
const PROFESSIONS: { id: string; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'Business Owner', label: 'Business Owner', icon: 'briefcase' },
  { id: 'Salaried Employee', label: 'Salaried Employee', icon: 'credit-card' },
  { id: 'Doctor', label: 'Doctor', icon: 'plus-circle' },
  { id: 'Engineer', label: 'Engineer', icon: 'settings' },
  { id: 'Government Officer', label: 'Govt. Officer', icon: 'shield' },
  { id: 'IAS / IPS / IFS', label: 'IAS / IPS / IFS', icon: 'star' },
  { id: 'Army / Navy / Air Force', label: 'Army / Defence', icon: 'award' },
  { id: 'Railway Employee', label: 'Railway Employee', icon: 'map' },
  { id: 'Teacher / Professor', label: 'Teacher / Prof', icon: 'book' },
  { id: 'Lawyer', label: 'Lawyer', icon: 'file-text' },
  { id: 'Farmer / Agriculture', label: 'Farmer', icon: 'sun' },
  { id: 'Delivery / Logistics (Zomato, Swiggy etc.)', label: 'Delivery Boy', icon: 'truck' },
  { id: 'Student / Intern', label: 'Student / Intern', icon: 'book-open' },
  { id: 'Freelancer / Self-Employed', label: 'Freelancer', icon: 'user' },
  { id: 'Other', label: 'Other', icon: 'more-horizontal' },
];

const TSHIRT_OPTS = ['S', 'M', 'L', 'XL', 'XXL'];
const RELATION_OPTS = ['Father', 'Mother', 'Spouse', 'Friend', 'Other'];
const BLOOD_OPTS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const validateAadhaar = (v: string) => /^\d{12}$/.test(v.replace(/\s/g, ''));
const validatePan = (v: string) => /^[A-Z]{5}\d{4}[A-Z]$/.test(v.toUpperCase());

type LoadState = 'loading' | 'ok' | 'not_eligible' | 'already_done' | 'error';
type ResumeMode = 'none' | 'aadhaar' | 'pan';

export default function KycScreen() {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const { token, ready } = useAuth();
  const appBarHeight = useAppBarHeight();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [regId, setRegId] = useState('');
  const [city, setCity] = useState('');

  // Player essentials
  const [tshirt, setTshirt] = useState('');
  const [trouser, setTrouser] = useState('');
  const [shoe, setShoe] = useState('');
  const [helmet, setHelmet] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [ecName, setEcName] = useState('');
  const [ecRel, setEcRel] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [ecPhoneErr, setEcPhoneErr] = useState('');

  // Identity
  const [profession, setProfession] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaarErr, setAadhaarErr] = useState('');
  const [panErr, setPanErr] = useState('');

  // Flow state
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | null>(null);
  const [panAutoVerified, setPanAutoVerified] = useState(true);
  const [kycMsg, setKycMsg] = useState('');
  const [resumeMode, setResumeMode] = useState<ResumeMode>('none');

  // OTP step
  const [aadhaarRefId, setAadhaarRefId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpErr, setOtpErr] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const dq = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => getDashboard(token as string),
    enabled: !!token,
  });

  useEffect(() => {
    if (!dq.data || !token) return;
    const d = dq.data;
    const reg = d.registration;
    (async () => {
      if (!d.registered || !reg || reg.phase1Status !== 'selected') { setLoadState('not_eligible'); return; }
      // Any phase2Status past payment_done (kyc_done, kyc_approved, trial_*,
      // auction_shortlisted, team_signed) OR a verified KYC record means the
      // KYC step is already behind them.
      const p2Done = ['kyc_done', 'kyc_approved', 'trial_cleared', 'auction_shortlisted', 'team_signed'].includes(reg.phase2Status ?? '');
      // Historic vocab tolerance: treat 'approved' the same as 'verified'.
      const kycRecordDone = d.kyc?.status === 'verified' || d.kyc?.status === 'approved';
      if (reg.phase2Status !== 'payment_done') {
        if (p2Done || kycRecordDone) { setLoadState('already_done'); return; }
        setLoadState('not_eligible'); return;
      }
      const rid = reg.id;
      setRegId(rid);
      setCity(reg.trialCity ?? '');
      // Resume support — never re-enter verified docs / re-bill.
      try {
        const prog = await getKycProgress(token, rid);
        if (prog.profile) {
          if (prog.profile.tshirtSize) setTshirt(prog.profile.tshirtSize);
          if (prog.profile.trouserSize) setTrouser(prog.profile.trouserSize);
          if (prog.profile.shoeSize) setShoe(prog.profile.shoeSize);
          if (prog.profile.helmetSize) setHelmet(prog.profile.helmetSize);
          if (prog.profile.emergencyName) setEcName(prog.profile.emergencyName);
          if (prog.profile.emergencyRelation) setEcRel(prog.profile.emergencyRelation);
          if (prog.profile.emergencyPhone && /^\d{10}$/.test(prog.profile.emergencyPhone)) setEcPhone(prog.profile.emergencyPhone);
          if (prog.profile.bloodGroup) setBloodGroup(prog.profile.bloodGroup);
        }
        if (prog.hasKyc && prog.profession) setProfession(prog.profession);
        if (prog.hasKyc && prog.status === 'pending') {
          if (!prog.aadhaarVerified) { setResumeMode('aadhaar'); setPanAutoVerified(prog.panVerified !== false); }
          else if (!prog.panVerified) { setResumeMode('pan'); }
          else { setKycStatus('pending'); }
        } else if (prog.hasKyc && (prog.status === 'verified' || prog.status === 'approved')) {
          setKycStatus('verified');
        }
      } catch { /* fresh KYC */ }
      setLoadState('ok');
    })();
  }, [dq.data, token]);

  const emergencyOk = !!(ecName.trim() && ecRel && /^\d{10}$/.test(ecPhone));
  const canSubmit = !!tshirt && !!trouser && !!shoe && !!helmet && emergencyOk && !!profession && !!aadhaar && !!pan && !aadhaarErr && !panErr;

  const goToApproved = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', token] });
    setTimeout(() => router.replace('/journey'), 1600);
  }, [router, token]);

  const handleSubmit = useCallback(async () => {
    if (!token) return;
    if (!validateAadhaar(aadhaar)) { setAadhaarErr(t('Aadhaar must be 12 digits', 'आधार 12 अंकों का होना चाहिए')); return; }
    if (!validatePan(pan)) { setPanErr(t('Enter a valid PAN (e.g. ABCDE1234F)', 'सही PAN डालें (जैसे ABCDE1234F)')); return; }
    if (!/^\d{10}$/.test(ecPhone)) { setEcPhoneErr(t('Enter a 10-digit mobile number', '10 अंकों का मोबाइल नंबर डालें')); return; }
    if (!profession || !tshirt || !trouser || !shoe || !helmet || !ecName.trim() || !ecRel) {
      setSubmitErr(t('Please complete profession, jersey details and emergency contact.', 'कृपया पेशा, जर्सी डिटेल्स और आपातकालीन संपर्क पूरा करें।'));
      return;
    }
    setSubmitting(true); setSubmitErr('');
    try {
      const result = await initiateKyc(token, {
        registrationId: regId,
        profession,
        aadhaarNumber: aadhaar.replace(/\s/g, ''),
        panNumber: pan.toUpperCase(),
        tshirtSize: tshirt,
        trouserSize: trouser,
        shoeSize: shoe,
        helmetSize: helmet,
        emergencyName: ecName.trim(),
        emergencyRelation: ecRel,
        emergencyPhone: ecPhone,
        bloodGroup: bloodGroup || undefined,
      });
      setKycMsg(result.message);
      if (result.status === 'OTP_SENT' && result.aadhaarRefId) {
        setPanAutoVerified(result.panVerified !== false);
        setAadhaarRefId(result.aadhaarRefId);
      } else if (result.status === 'verified' || result.status === 'VALID') {
        setKycStatus('verified'); goToApproved();
      } else if (result.status === 'PAN_RETRY') {
        setResumeMode('pan');
      } else {
        setKycStatus('pending');
      }
    } catch (e: any) {
      setSubmitErr(e instanceof ApiError ? e.message : t('KYC submission failed. Please try again.', 'KYC सबमिशन विफल रहा। कृपया पुनः प्रयास करें।'));
    } finally { setSubmitting(false); }
  }, [token, aadhaar, pan, ecPhone, profession, tshirt, ecName, ecRel, bloodGroup, regId, t, goToApproved]);

  const handleAadhaarResume = useCallback(async () => {
    if (!token) return;
    if (!validateAadhaar(aadhaar)) { setAadhaarErr(t('Aadhaar must be 12 digits', 'आधार 12 अंकों का होना चाहिए')); return; }
    setSubmitting(true); setSubmitErr('');
    try {
      const result = await kycAadhaarOtp(token, { registrationId: regId, aadhaarNumber: aadhaar.replace(/\s/g, '') });
      setKycMsg(result.message);
      if (result.status === 'OTP_SENT' && result.aadhaarRefId) {
        setPanAutoVerified(result.panVerified !== false); setAadhaarRefId(result.aadhaarRefId);
      } else if (result.status === 'verified') { setKycStatus('verified'); goToApproved(); }
      else if (result.status === 'AADHAAR_DONE') { setResumeMode('pan'); }
    } catch (e: any) {
      setSubmitErr(e instanceof ApiError ? e.message : t('Could not send OTP. Please try again.', 'OTP नहीं भेजा जा सका। कृपया पुनः प्रयास करें।'));
    } finally { setSubmitting(false); }
  }, [token, aadhaar, regId, t, goToApproved]);

  const handlePanResume = useCallback(async () => {
    if (!token) return;
    if (!validatePan(pan)) { setPanErr(t('Enter a valid PAN (e.g. ABCDE1234F)', 'सही PAN डालें (जैसे ABCDE1234F)')); return; }
    setSubmitting(true); setSubmitErr('');
    try {
      const result = await kycVerifyPan(token, { registrationId: regId, panNumber: pan.toUpperCase() });
      setKycMsg(result.message);
      if (result.status === 'verified') { setKycStatus('verified'); goToApproved(); }
      else if (result.status === 'MANUAL_REVIEW') { setKycStatus('pending'); }
      else if (result.status === 'PAN_VERIFIED') { setResumeMode('aadhaar'); setPanAutoVerified(true); }
    } catch (e: any) {
      setSubmitErr(e instanceof ApiError ? e.message : t('PAN verification failed. Please try again.', 'PAN वेरिफिकेशन विफल रहा। कृपया पुनः प्रयास करें।'));
    } finally { setSubmitting(false); }
  }, [token, pan, regId, t, goToApproved]);

  const handleOtpResend = useCallback(async () => {
    if (!token) return;
    if (!validateAadhaar(aadhaar)) {
      setSubmitErr(t('Re-enter your 12-digit Aadhaar to resend the OTP.', 'OTP दोबारा भेजने के लिए अपना 12 अंकों का आधार फिर से डालें।'));
      setAadhaarRefId(''); setResumeMode('aadhaar'); return;
    }
    setSubmitting(true); setSubmitErr('');
    try {
      const result = await kycAadhaarOtp(token, { registrationId: regId, aadhaarNumber: aadhaar.replace(/\s/g, '') });
      if (result.status === 'OTP_SENT' && result.aadhaarRefId) setAadhaarRefId(result.aadhaarRefId);
      else setSubmitErr(result.message || t('Could not resend OTP.', 'OTP दोबारा नहीं भेजा जा सका।'));
    } catch (e: any) { setSubmitErr(e instanceof ApiError ? e.message : t('Could not resend OTP.', 'OTP दोबारा नहीं भेजा जा सका।')); }
    finally { setSubmitting(false); }
  }, [token, aadhaar, regId, t]);

  const handleOtpVerify = useCallback(async () => {
    if (!token) return;
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) { setOtpErr(t('6-digit OTP required', '6 अंकों का OTP चाहिए')); return; }
    setOtpLoading(true); setOtpErr('');
    try {
      const result = await verifyKycOtp(token, { registrationId: regId, aadhaarRefId, otp });
      if (result.status === 'verified') { setKycStatus('verified'); setKycMsg(result.message); goToApproved(); }
      else if (result.status === 'PAN_RETRY') { setResumeMode('pan'); setKycMsg(result.message); setAadhaarRefId(''); }
      else if (result.status === 'MANUAL_REVIEW') { setKycStatus('pending'); setKycMsg(result.message); }
      else setOtpErr(result.message || t('Verification failed. Try again.', 'वेरिफिकेशन विफल रहा। फिर कोशिश करें।'));
    } catch (e: any) {
      setOtpErr(e instanceof ApiError ? e.message : t('Incorrect OTP or expired. Please try again.', 'गलत OTP या समय समाप्त। कृपया पुनः प्रयास करें।'));
    } finally { setOtpLoading(false); }
  }, [token, otp, regId, aadhaarRefId, t, goToApproved]);

  if (!ready) return <LoadingView />;

  const Header = (
    <>
      <ScreenBackground />
      <GlassAppBar title={t('KYC Verification', 'KYC वेरिफिकेशन')} back={true} />
    </>
  );

  if (!token) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: appBarHeight }}>
          <Feather name="lock" size={28} color={c.magenta} />
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
            {t('Log in to complete your KYC', 'अपना KYC पूरा करने के लिए लॉगिन करें')}
          </Text>
        </View>
      </View>
    );
  }
  if (loadState === 'loading' || dq.isLoading) return (<View style={{ flex: 1, backgroundColor: c.bg }}>{Header}<LoadingView /></View>);
  if (dq.isError && !dq.data) return (<View style={{ flex: 1, backgroundColor: c.bg }}>{Header}<ErrorView onRetry={() => dq.refetch()} /></View>);

  if (loadState === 'already_done') return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: appBarHeight }}>
        <Feather name="check-circle" size={40} color={c.mint} />
        <Text style={{ color: c.mint, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, marginTop: 16, textAlign: 'center' }}>
          {t('KYC already verified', 'KYC पहले ही वेरिफाई हो चुका है')}
        </Text>
        <Pressable onPress={() => router.replace('/journey')} style={({ pressed }) => [styles.btn, { marginTop: 22, opacity: pressed ? 0.85 : 1 }]}>
          <LinearGradient colors={['#16E0A3', '#00B8D9']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
          <Text style={styles.btnText}>{t('Back to my journey', 'मेरे सफ़र पर वापस')}</Text>
        </Pressable>
      </View>
    </View>
  );
  if (loadState === 'not_eligible' || loadState === 'error') return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: appBarHeight }}>
        <Feather name="lock" size={40} color={c.amber} />
        <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, marginTop: 16, textAlign: 'center' }}>
          {t('KYC not available yet', 'KYC अभी उपलब्ध नहीं')}
        </Text>
        <Text style={{ color: c.sub, fontSize: 13.5, marginTop: 10, textAlign: 'center', lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium', maxWidth: 340 }}>
          {t('Complete Phase 2 payment first, then return here for KYC.', 'पहले फेज 2 भुगतान पूरा करें, फिर KYC के लिए यहाँ लौटें।')}
        </Text>
        <Pressable onPress={() => router.replace('/journey')} style={({ pressed }) => [styles.btn, { marginTop: 22, opacity: pressed ? 0.85 : 1 }]}>
          <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
          <Text style={styles.btnText}>{t('Back to my journey', 'मेरे सफ़र पर वापस')}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: appBarHeight + 8, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* Progress line */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <StageChip label={t('PHASE 1 CLEARED', 'फेज 1 क्लियर')} done c={c} />
          <StageChip label={t('PHASE 2 PAID', 'फेज 2 पेड')} done c={c} />
          <StageChip label={kycStatus === 'verified' ? t('KYC VERIFIED', 'KYC वेरिफाइड') : t('KYC PENDING', 'KYC पेंडिंग')} done={kycStatus === 'verified'} c={c} />
        </View>

        <LinearGradient colors={['#00DCF5', '#4B6BFF']} style={{ width: 48, height: 4, borderRadius: 2, marginBottom: 12 }} />
        <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 28, color: c.ink, letterSpacing: -0.5 }}>
          {kycStatus === 'verified' ? t('KYC Verified', 'KYC वेरिफाइड') : t('Player Details & KYC', 'प्लेयर जानकारी और KYC')}
        </Text>
        <Text style={{ color: c.sub, fontSize: 14, marginTop: 6, lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium' }}>
          {t('Emergency contact and identity verification — required for compliance and franchise contract records.', 'आपातकालीन संपर्क और पहचान वेरिफिकेशन — compliance और फ्रैंचाइज़ी कॉन्ट्रैक्ट के लिए आवश्यक।')}
        </Text>

        {/* ── VERIFIED ── */}
        {kycStatus === 'verified' ? (
          <Card style={{ marginTop: 22, alignItems: 'center', paddingVertical: 36 }}>
            <View style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <LinearGradient colors={['#16E0A3', '#00B8D9']} style={StyleSheet.absoluteFill} />
              <Feather name="check" size={40} color="#fff" />
            </View>
            <Text style={{ color: c.mint, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, marginTop: 18, textAlign: 'center' }}>
              {t('KYC verification complete', 'KYC वेरिफिकेशन पूरा')}
            </Text>
            <Text style={{ color: c.sub, fontSize: 13.5, marginTop: 10, textAlign: 'center', lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium' }}>
              {kycMsg || t('All documents verified. You are cleared for BCPL Season 5 physical trials.', 'सभी दस्तावेज़ वेरिफाई हो गए। आप BCPL सीज़न 5 फिजिकल ट्रायल के लिए क्लियर हैं।')}
            </Text>
          </Card>
        ) : kycStatus === 'pending' ? (
          <Card style={{ marginTop: 22, alignItems: 'center', paddingVertical: 36 }}>
            <Feather name="clock" size={40} color={c.getAccentText(c.amber)} />
            <Text style={{ color: c.getAccentText(c.amber), fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginTop: 16, textAlign: 'center' }}>
              {t('KYC submitted for review', 'KYC रिव्यू के लिए सबमिट हो गया')}
            </Text>
            <Text style={{ color: c.sub, fontSize: 13.5, marginTop: 10, textAlign: 'center', lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium' }}>
              {kycMsg || t('Your documents are under review. You will receive an SMS + email when verified (usually within 24 hours).', 'आपके दस्तावेज़ रिव्यू में हैं। वेरिफाई होने पर आपको SMS + ईमेल मिलेगा (आमतौर पर 24 घंटे में)।')}
            </Text>
          </Card>
        ) : aadhaarRefId ? (
          /* ── STEP 2: Aadhaar OTP ── */
          <Card style={{ marginTop: 22 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Feather name="smartphone" size={34} color={c.mint} />
              <Text style={{ color: c.mint, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginTop: 12, textAlign: 'center' }}>
                {panAutoVerified ? t('PAN verified', 'PAN वेरिफाइड') : t('Documents received', 'दस्तावेज़ प्राप्त')}
              </Text>
              {!panAutoVerified ? (
                <Text style={{ color: c.getAccentText(c.amber), fontSize: 13, marginTop: 8, textAlign: 'center', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                  {t('PAN will be verified by our team — no action needed from you.', 'PAN हमारी टीम वेरिफाई करेगी — आपको कुछ करने की ज़रूरत नहीं।')}
                </Text>
              ) : null}
              <Text style={{ color: c.sub, fontSize: 13.5, marginTop: 10, textAlign: 'center', lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {t('An OTP has been sent to your Aadhaar-linked mobile number. Enter it below to complete verification.', 'आपके आधार से जुड़े मोबाइल नंबर पर एक OTP भेजा गया है। वेरिफिकेशन पूरा करने के लिए इसे नीचे डालें।')}
              </Text>
            </View>
            <Label c={c} text={t('AADHAAR OTP (6 digits) *', 'आधार OTP (6 अंक) *')} />
            <View style={[styles.inputWrap, { borderColor: otpErr ? c.coral : otp.length === 6 ? c.mint : c.line, backgroundColor: c.card2 }]}>
              <TextInput
                value={otp}
                onChangeText={(v) => { setOtp(v.replace(/\D/g, '').slice(0, 6)); setOtpErr(''); }}
                placeholder="••••••"
                placeholderTextColor={c.sub}
                keyboardType="number-pad"
                maxLength={6}
                style={{ color: c.ink, fontSize: 24, letterSpacing: 6, textAlign: 'center', fontFamily: 'PlusJakartaSans_700Bold', paddingVertical: 8 }}
              />
            </View>
            {otpErr ? <ErrLine c={c} text={otpErr} /> : null}
            <Pressable onPress={handleOtpVerify} disabled={otpLoading || otp.length !== 6} style={({ pressed }) => [styles.btn, { marginTop: 18, opacity: otpLoading || otp.length !== 6 ? 0.45 : pressed ? 0.85 : 1 }]} testID="kyc-otp-verify">
              <LinearGradient colors={['#16E0A3', '#00B8D9']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Text style={styles.btnText}>{otpLoading ? t('Verifying…', 'वेरिफाई हो रहा है…') : t('Verify & complete KYC', 'वेरिफाई करें और KYC पूरा करें')}</Text>
            </Pressable>
            <Pressable onPress={handleOtpResend} disabled={submitting} style={{ marginTop: 14, alignItems: 'center' }}>
              <Text style={{ color: submitting ? c.sub : c.cyan, fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>
                {submitting ? t('Resending…', 'दोबारा भेज रहे हैं…') : t("Didn't get the OTP? Resend", 'OTP नहीं मिला? दोबारा भेजें')}
              </Text>
            </Pressable>
            {submitErr ? <ErrLine c={c} text={submitErr} /> : null}
          </Card>
        ) : resumeMode === 'aadhaar' ? (
          /* ── RESUME: only Aadhaar OTP left ── */
          <Card style={{ marginTop: 22 }}>
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <Feather name="credit-card" size={32} color={c.amber} />
              <Text style={{ color: c.getAccentText(c.amber), fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginTop: 12, textAlign: 'center' }}>
                {t('Resume your KYC', 'अपना KYC फिर से शुरू करें')}
              </Text>
              <Text style={{ color: panAutoVerified ? c.mint : c.getAccentText(c.amber), fontSize: 13, marginTop: 8, textAlign: 'center', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                {panAutoVerified ? t('PAN already verified — it will not be checked again', 'PAN पहले ही वेरिफाइड — दोबारा चेक नहीं होगा') : t('PAN is with our team for review — no action needed on PAN', 'PAN हमारी टीम के पास रिव्यू में है — PAN पर कुछ नहीं करना')}
              </Text>
              <Text style={{ color: c.sub, fontSize: 13, marginTop: 10, textAlign: 'center', lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {t('Only the Aadhaar OTP step is left. For your privacy we never store your Aadhaar number — enter it again to receive a fresh OTP.', 'केवल आधार OTP स्टेप बचा है। आपकी गोपनीयता के लिए हम आपका आधार नंबर कभी सेव नहीं करते — नया OTP पाने के लिए इसे दोबारा डालें।')}
              </Text>
            </View>
            <Label c={c} text={t('AADHAAR NUMBER *', 'आधार नंबर *')} />
            <TextField c={c} value={aadhaar} onChange={(v) => { setAadhaar(v); setAadhaarErr(''); }} onBlur={() => setAadhaarErr(aadhaar && !validateAadhaar(aadhaar) ? t('Aadhaar must be 12 digits', 'आधार 12 अंकों का होना चाहिए') : '')} placeholder="XXXX XXXX XXXX" keyboard="number-pad" maxLength={14} valid={aadhaar ? validateAadhaar(aadhaar) : undefined} err={!!aadhaarErr} />
            {aadhaarErr ? <ErrLine c={c} text={aadhaarErr} /> : null}
            {submitErr ? <ErrLine c={c} text={submitErr} /> : null}
            <Pressable onPress={handleAadhaarResume} disabled={submitting || !validateAadhaar(aadhaar)} style={({ pressed }) => [styles.btn, { marginTop: 18, opacity: submitting || !validateAadhaar(aadhaar) ? 0.45 : pressed ? 0.85 : 1 }]}>
              <LinearGradient colors={['#00DCF5', '#4B6BFF']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Text style={styles.btnText}>{submitting ? t('Sending OTP…', 'OTP भेज रहे हैं…') : t('Send Aadhaar OTP', 'आधार OTP भेजें')}</Text>
            </Pressable>
            <Pressable onPress={() => setResumeMode('none')} style={{ marginTop: 14, alignItems: 'center' }}>
              <Text style={{ color: c.sub, fontSize: 12.5, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Fill the full form again instead', 'इसके बजाय पूरा फॉर्म दोबारा भरें')}</Text>
            </Pressable>
          </Card>
        ) : resumeMode === 'pan' ? (
          /* ── RESUME: only PAN left ── */
          <Card style={{ marginTop: 22 }}>
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <Feather name="file-text" size={32} color={c.mint} />
              <Text style={{ color: c.mint, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginTop: 12, textAlign: 'center' }}>
                {t('Almost done — PAN verification', 'लगभग पूरा — PAN वेरिफिकेशन')}
              </Text>
              <Text style={{ color: c.mint, fontSize: 13, marginTop: 8, textAlign: 'center', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                {t('Aadhaar OTP verified', 'आधार OTP वेरिफाइड')}
              </Text>
              <Text style={{ color: c.sub, fontSize: 13, marginTop: 10, textAlign: 'center', lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {t('Please provide your PAN number to complete the final compliance step.', 'अंतिम compliance स्टेप पूरा करने के लिए कृपया अपना PAN नंबर दें।')}
              </Text>
            </View>
            <Label c={c} text={t('PAN NUMBER *', 'PAN नंबर *')} />
            <TextField c={c} value={pan} onChange={(v) => { setPan(v.toUpperCase()); setPanErr(''); }} onBlur={() => setPanErr(pan && !validatePan(pan) ? t('Enter a valid PAN (e.g. ABCDE1234F)', 'सही PAN डालें (जैसे ABCDE1234F)') : '')} placeholder="ABCDE1234F" maxLength={10} valid={pan ? validatePan(pan) : undefined} err={!!panErr} />
            {panErr ? <ErrLine c={c} text={panErr} /> : null}
            {submitErr ? <ErrLine c={c} text={submitErr} /> : null}
            <Pressable onPress={handlePanResume} disabled={submitting || !validatePan(pan)} style={({ pressed }) => [styles.btn, { marginTop: 18, opacity: submitting || !validatePan(pan) ? 0.45 : pressed ? 0.85 : 1 }]}>
              <LinearGradient colors={['#16E0A3', '#00B8D9']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Text style={styles.btnText}>{submitting ? t('Verifying PAN…', 'PAN वेरिफाई हो रहा है…') : t('Verify PAN & complete KYC', 'PAN वेरिफाई करें और KYC पूरा करें')}</Text>
            </Pressable>
            <Pressable onPress={() => setResumeMode('none')} style={{ marginTop: 14, alignItems: 'center' }}>
              <Text style={{ color: c.sub, fontSize: 12.5, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('Fill the full form again instead', 'इसके बजाय पूरा फॉर्म दोबारा भरें')}</Text>
            </Pressable>
          </Card>
        ) : (
          /* ── STEP 1: full form ── */
          <>
            {/* 1. Player essentials */}
            <Card style={{ marginTop: 22 }}>
              <SectionTitle c={c} n="1" title={t('Jersey Details', 'जर्सी डिटेल्स')} sub={t('These jersey details are not for trials — no kit is provided at trials. If you are picked into a team through the auction, having your sizes on file makes jersey preparation easy. Please fill your sizes accordingly.', 'ये jersey details trials के लिए नहीं हैं — trials में kit नहीं दी जाती। अगर auction के ज़रिए आप किसी team में चुने जाते हैं, तो आपकी sizes पहले से हमारे पास होने से jersey बनवाना आसान रहेगा। इसी हिसाब से अपनी सही sizes भरें।')} />
              <Label c={c} text={t('T-SHIRT SIZE *', 'टी-शर्ट साइज़ *')} />
              <ChipRow options={TSHIRT_OPTS} value={tshirt} onChange={setTshirt} c={c} />
              <View style={{ height: 18 }} />
              <Label c={c} text={t('TROUSER SIZE *', 'ट्राउज़र साइज़ *')} />
              <ChipRow options={['28', '30', '32', '34', '36', '38', '40', '42', '44']} value={trouser} onChange={setTrouser} c={c} />
              <View style={{ height: 18 }} />
              <Label c={c} text={t('SHOE SIZE (UK) *', 'जूते का साइज़ (UK) *')} />
              <ChipRow options={['4', '5', '6', '7', '8', '9', '10', '11', '12']} value={shoe} onChange={setShoe} c={c} />
              <View style={{ height: 18 }} />
              <Label c={c} text={t('HELMET SIZE *', 'हेलमेट साइज़ *')} />
              <ChipRow options={['S', 'M', 'L', 'XL']} value={helmet} onChange={setHelmet} c={c} />
              <View style={{ height: 18 }} />
              <Label c={c} text={t('BLOOD GROUP', 'ब्लड ग्रुप')} />
              <ChipRow options={BLOOD_OPTS} value={bloodGroup} onChange={setBloodGroup} c={c} />

              <View style={{ height: 22, marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }} />
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15, marginBottom: 14 }}>{t('Emergency contact', 'आपातकालीन संपर्क')}</Text>
              <Label c={c} text={t('CONTACT PERSON NAME *', 'संपर्क व्यक्ति का नाम *')} />
              <TextField c={c} value={ecName} onChange={setEcName} placeholder={t('Full name', 'पूरा नाम')} />
              <View style={{ height: 16 }} />
              <Label c={c} text={t('RELATION *', 'रिश्ता *')} />
              <ChipRow options={RELATION_OPTS} value={ecRel} onChange={setEcRel} c={c} />
              <View style={{ height: 16 }} />
              <Label c={c} text={t('EMERGENCY MOBILE NUMBER *', 'आपातकालीन मोबाइल नंबर *')} />
              <TextField c={c} value={ecPhone} onChange={(v) => { setEcPhone(v.replace(/\D/g, '').slice(0, 10)); setEcPhoneErr(''); }} onBlur={() => setEcPhoneErr(ecPhone && !/^\d{10}$/.test(ecPhone) ? t('Enter a 10-digit mobile number', '10 अंकों का मोबाइल नंबर डालें') : '')} placeholder={t('10-digit number', '10 अंकों का नंबर')} keyboard="number-pad" maxLength={10} err={!!ecPhoneErr} />
              {ecPhoneErr ? <ErrLine c={c} text={ecPhoneErr} /> : null}
            </Card>

            {/* 2. Employment */}
            <Card style={{ marginTop: 12 }}>
              <SectionTitle c={c} n="2" title={t('Employment details', 'रोज़गार की जानकारी')} sub={t('Required to confirm working professional eligibility.', 'वर्किंग प्रोफेशनल योग्यता की पुष्टि के लिए आवश्यक।')} />
              <Label c={c} text={t('SELECT YOUR PROFESSION *', 'अपना पेशा चुनें *')} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {PROFESSIONS.map((p) => {
                  const active = profession === p.id;
                  return (
                    <Pressable key={p.id} onPress={() => setProfession(p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: active ? 2 : 1, borderColor: active ? c.cyan : c.line, backgroundColor: active ? 'rgba(0,220,245,0.08)' : c.card2 }}>
                      <Feather name={p.icon} size={15} color={active ? c.cyan : c.sub} />
                      <Text style={{ color: active ? c.cyan : c.ink, fontSize: 12.5, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{p.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            {/* 3. Identity */}
            <Card style={{ marginTop: 12 }}>
              <SectionTitle c={c} n="3" title={t('Identity verification', 'पहचान वेरिफिकेशन')} sub={t('Compliance and franchise record requirements. Aadhaar OTP will be sent.', 'Compliance और फ्रैंचाइज़ी रिकॉर्ड के लिए आवश्यक। आधार OTP भेजा जाएगा।')} />
              <Label c={c} text={t('AADHAAR NUMBER *', 'आधार नंबर *')} />
              <TextField c={c} value={aadhaar} onChange={(v) => { setAadhaar(v); setAadhaarErr(''); }} onBlur={() => setAadhaarErr(aadhaar && !validateAadhaar(aadhaar) ? t('Aadhaar must be 12 digits', 'आधार 12 अंकों का होना चाहिए') : '')} placeholder="XXXX XXXX XXXX" keyboard="number-pad" maxLength={14} valid={aadhaar ? validateAadhaar(aadhaar) : undefined} err={!!aadhaarErr} />
              {aadhaarErr ? <ErrLine c={c} text={aadhaarErr} /> : null}
              <Text style={{ color: c.sub, fontSize: 11.5, marginTop: 8, lineHeight: 17, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {t('An OTP will be sent to the mobile number linked with this Aadhaar.', 'इस आधार से जुड़े मोबाइल नंबर पर एक OTP भेजा जाएगा।')}
              </Text>
              <View style={{ height: 18 }} />
              <Label c={c} text={t('PAN NUMBER *', 'PAN नंबर *')} />
              <TextField c={c} value={pan} onChange={(v) => { setPan(v.toUpperCase()); setPanErr(''); }} onBlur={() => setPanErr(pan && !validatePan(pan) ? t('Enter a valid PAN (e.g. ABCDE1234F)', 'सही PAN डालें (जैसे ABCDE1234F)') : '')} placeholder="ABCDE1234F" maxLength={10} valid={pan ? validatePan(pan) : undefined} err={!!panErr} />
              {panErr ? <ErrLine c={c} text={panErr} /> : null}
              <Text style={{ color: c.sub, fontSize: 11.5, marginTop: 8, lineHeight: 17, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {t('Required for franchise contract and prize money tax compliance.', 'फ्रैंचाइज़ी कॉन्ट्रैक्ट और इनामी राशि के टैक्स नियमों के लिए आवश्यक।')}
              </Text>
              {submitErr ? <ErrLine c={c} text={submitErr} /> : null}
              <Pressable onPress={handleSubmit} disabled={!canSubmit || submitting} style={({ pressed }) => [styles.btn, { marginTop: 20, opacity: !canSubmit || submitting ? 0.45 : pressed ? 0.85 : 1 }]} testID="kyc-submit">
                <LinearGradient colors={['#00DCF5', '#4B6BFF']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
                <Text style={styles.btnText}>{submitting ? t('Verifying documents…', 'दस्तावेज़ों की जाँच हो रही है…') : t('Proceed to Aadhaar OTP', 'आधार OTP के लिए आगे बढ़ें')}</Text>
              </Pressable>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

type C = ReturnType<typeof useColors>;

function StageChip({ label, done, c }: { label: string; done: boolean; c: C }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: done ? 'rgba(22,224,163,0.12)' : c.card2, borderWidth: 1, borderColor: done ? 'rgba(22,224,163,0.35)' : c.line }}>
      <Feather name={done ? 'check' : 'circle'} size={11} color={done ? c.mint : c.sub} />
      <Text style={{ color: done ? c.mint : c.sub, fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

function SectionTitle({ c, n, title, sub }: { c: C; n: string; title: string; sub: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 17 }}>{n}. {title}</Text>
      <Text style={{ color: c.sub, fontSize: 12.5, marginTop: 4, lineHeight: 18, fontFamily: 'PlusJakartaSans_500Medium' }}>{sub}</Text>
    </View>
  );
}

function Label({ c, text }: { c: C; text: string }) {
  return <Text style={{ color: c.sub, fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.8, marginBottom: 8 }}>{text}</Text>;
}

function ErrLine({ c, text }: { c: C; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
      <Feather name="alert-triangle" size={12} color={c.coral} />
      <Text style={{ color: c.coral, fontSize: 12.5, fontFamily: 'PlusJakartaSans_600SemiBold', flex: 1 }}>{text}</Text>
    </View>
  );
}

function TextField({ c, value, onChange, onBlur, placeholder, keyboard, maxLength, valid, err }: {
  c: C; value: string; onChange: (v: string) => void; onBlur?: () => void; placeholder: string;
  keyboard?: 'default' | 'number-pad'; maxLength?: number; valid?: boolean; err?: boolean;
}) {
  const border = err ? c.coral : valid === true ? c.mint : c.line;
  return (
    <View style={[styles.inputWrap, { borderColor: border, backgroundColor: c.card2 }]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={c.sub}
        keyboardType={keyboard ?? 'default'}
        maxLength={maxLength}
        autoCapitalize={keyboard === 'number-pad' ? 'none' : 'characters'}
        style={{ color: c.ink, fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', paddingVertical: 4 }}
      />
    </View>
  );
}

function ChipRow({ options, value, onChange, c }: { options: string[]; value: string; onChange: (v: string) => void; c: C }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
      {options.map((o) => {
        const active = value === o;
        return (
          <Pressable key={o} onPress={() => onChange(active ? '' : o)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: active ? 2 : 1, borderColor: active ? c.cyan : c.line, backgroundColor: active ? 'rgba(0,220,245,0.08)' : c.card2 }}>
            <Text style={{ color: active ? c.cyan : c.ink, fontSize: 13.5, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, overflow: 'hidden',
  },
  btnText: { color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 },
  inputWrap: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
});
