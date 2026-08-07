import React from 'react';
import {
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang, type Lang } from '@/context/LanguageContext';
import { getDashboard, getSponsors, type Sponsor } from '@/lib/api';
import { Image } from 'expo-image';
import { useTheme } from '@/context/ThemeContext';
import { Badge, Card, ErrorView, LoadingView, GlassAppBar, ScreenBackground, GradientTag, useAppBarHeight, useBottomNavHeight } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AvatarCircle } from '@/components/AvatarCircle';
import { roleLabel } from '@/lib/roleLabel';
import { LinearGradient } from 'expo-linear-gradient';

function StatusRow({ label, value, done, isCurrent }: { label: string; value: string; done?: boolean; isCurrent?: boolean }) {
  const c = useColors();
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusIconWrap, done && { backgroundColor: 'rgba(49, 197, 107, 0.2)' }, isCurrent && !done && { backgroundColor: 'rgba(0, 229, 255, 0.2)' }]}>
        <Feather
          name={done ? 'check-circle' : isCurrent ? 'clock' : 'circle'}
          size={18}
          color={done ? c.mint : isCurrent ? c.cyan : (c.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(124, 92, 255, 0.4)')}
        />
      </View>
      <Text style={{ color: done || isCurrent ? c.ink : c.sub, fontSize: 14.5, flex: 1, fontFamily: 'PlusJakartaSans_700Bold' }}>{label}</Text>
      <View style={[
        styles.statusValuePill,
        { backgroundColor: c.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(124, 92, 255, 0.05)', borderColor: c.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(124, 92, 255, 0.2)' },
        done && { backgroundColor: 'rgba(49, 197, 107, 0.15)', borderColor: 'rgba(49, 197, 107, 0.4)' },
        isCurrent && !done && { backgroundColor: 'rgba(0, 229, 255, 0.15)', borderColor: 'rgba(0, 229, 255, 0.4)' }
      ]}>
        <Text style={{ color: done ? c.mint : isCurrent ? c.cyan : c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function niceStatus(s?: string | null): string {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

/* KYC-done detection. kyc_records.status is canonically 'verified' (historic
   rows may carry 'approved') — the old code here only checked 'approved', so a
   real 'verified' user wrongly showed KYC as still awaited. Also treat any
   phase2Status that is past KYC as done. */
const KYC_DONE_STATUSES = ['verified', 'approved'];
const P2_PAST_KYC = ['kyc_done', 'kyc_approved', 'trial_cleared', 'auction_shortlisted', 'team_signed'];
function isKycDone(kycStatus?: string | null, phase2Status?: string | null): boolean {
  if (kycStatus && KYC_DONE_STATUSES.includes(kycStatus)) return true;
  if (phase2Status && P2_PAST_KYC.includes(phase2Status)) return true;
  return false;
}

function LangSwitch() {
  const c = useColors();
  const { lang, setLang, t } = useLang();
  const { token } = useAuth();
  const router = useRouter();
  const opts: { value: Lang; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिंदी' },
  ];
  const { theme, toggleTheme } = useTheme();
  return (
    <Card padding={0} border={true}>
      <View style={{ padding: 20, paddingBottom: 16 }}>
        <Text style={[styles.cardTitle, { color: c.ink }]}>{t('Preferences', 'प्राथमिकता')}</Text>
      </View>
      {token ? (
        <Pressable
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [styles.prefRow, { borderTopColor: c.line, opacity: pressed ? 0.7 : 1 }]}
          testID="profile-row"
        >
          <View style={[styles.prefIcon, { backgroundColor: c.card2, borderColor: c.line }]}>
            <Feather name="user" size={18} color={c.getAccentText(c.magenta)} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>{t('Profile', 'प्रोफ़ाइल')}</Text>
            <Text style={{ color: c.sub, fontSize: 13, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' }}>{t('Your registered player details', 'आपकी रजिस्टर्ड खिलाड़ी जानकारी')}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={c.sub} />
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => router.push('/about')}
        style={({ pressed }) => [styles.prefRow, { borderTopWidth: token ? 0 : 1, borderTopColor: c.line, opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={[styles.prefIcon, { backgroundColor: c.card2, borderColor: c.line }]}>
          <Feather name="info" size={18} color={c.cyan} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>{t('About BCPL', 'BCPL के बारे में')}</Text>
          <Text style={{ color: c.sub, fontSize: 13, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' }}>{t('Our journey and mission', 'हमारा सफर और मिशन')}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={c.sub} />
      </Pressable>

      <View style={{ padding: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: c.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16 }}>
            {t('App Theme', 'ऐप थीम')}
          </Text>
          <Pressable
            onPress={toggleTheme}
            style={{ flexDirection: 'row', backgroundColor: c.card2, borderRadius: 20, padding: 4, borderWidth: 1, borderColor: c.line }}
          >
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: theme === 'stadium' ? c.card : 'transparent' }}>
              <Feather name="moon" size={14} color={theme === 'stadium' ? c.cyan : c.sub} />
            </View>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: theme === 'light' ? c.card : 'transparent' }}>
              <Feather name="sun" size={14} color={theme === 'light' ? c.orange : c.sub} />
            </View>
          </Pressable>
        </View>
        <Text style={[styles.cardTitle, { color: c.ink, marginBottom: 12, fontSize: 16 }]}>{t('Language', 'भाषा')}</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        {opts.map((o) => {
          const isActive = lang === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => setLang(o.value)}
              style={({ pressed }) => [
                styles.langBtn,
                {
                  borderColor: isActive ? c.violet : c.line,
                  backgroundColor: isActive ? c.card2 : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              testID={`lang-${o.value}`}
            >
              <Text
                style={{
                  color: isActive ? c.violet : c.sub,
                  fontFamily: isActive ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold',
                  fontSize: 14,
                }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      </View>
    </Card>
  );
}

import { AccordionItem, LegalGrid, IconRow } from '@/components/MoreSections';

const FAQ_ITEMS = [
  {
    enTitle: "Can I register from any city?",
    hiTitle: "क्या मैं किसी भी शहर से register कर सकता हूं?",
    enBody: "Yes! We have trial cities across India. Simply select your nearest city during the registration process.",
    hiBody: "हां! हमारे पास पूरे भारत में trial cities हैं। Registration process के दौरान अपना nearest city select करें।"
  },
  {
    enTitle: "Is the Phase 1 fee refundable?",
    hiTitle: "क्या Phase 1 fee refundable है?",
    enBody: "No. Once a Phase 1 payment is successfully completed, the fee is non-refundable.",
    hiBody: "नहीं। एक बार Phase 1 payment सफलतापूर्वक पूरा हो जाने पर fee non-refundable है।"
  },
  {
    enTitle: "Do humans manually watch every video?",
    hiTitle: "क्या हर video को इंसान manually देखते हैं?",
    enBody: "Not necessarily. BCPL may use automated, digital and technology-assisted assessment systems.",
    hiBody: "ज़रूरी नहीं। BCPL automated, digital और technology-assisted assessment systems का उपयोग कर सकता है।"
  }
];

function MoreMenu() {
  const c = useColors();
  const { t } = useLang();
  const router = useRouter();

  return (
    <View style={{ gap: 24 }}>
      <View>
        <Card padding={16} border={true}>
          <IconRow 
            icon="image" title={t('Media', 'मीडिया')} subtitle={t('Photos, Videos & Shorts', 'फ़ोटोज़, वीडियोज़ और शॉर्ट्स')}
            colors={['#FF3DA6', '#FF8A3D']} onPress={() => router.push('/media')} 
          />
          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 12, marginLeft: 50 }} />
          <IconRow 
            icon="watch" title={t('Scorer', 'स्कोरर')} subtitle={t('Score your local matches', 'अपना मैच स्कोर करें')}
            colors={['#5B2BF0', '#00DCF5']} onPress={() => router.push('/scorer')} 
          />
        </Card>
      </View>

      <View>
        <Text style={[styles.cardTitle, { color: c.ink, marginBottom: 12 }]}>{t('League & Rules', 'लीग और नियम')}</Text>
        <Card padding={16} border={true}>
          <IconRow 
            icon="calendar" title={t('Schedule', 'शेड्यूल')} subtitle={t('Upcoming matches', 'आने वाले मैच')}
            colors={['#5B2BF0', '#9B2FF0']} onPress={() => router.navigate('/matches')} 
          />
          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 4 }} />
          <IconRow 
            icon="shield" title={t('Teams', 'टीमें')} subtitle={t('All 10 franchises & squads', 'सभी 10 फ्रैंचाइज़ी और टीमें')}
            colors={['#7C5CFF', '#FF3DA6']} onPress={() => router.navigate('/teams')} 
          />
          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 4 }} />
          <IconRow 
            icon="bar-chart-2" title={t('Points Table', 'पॉइंट्स टेबल')} subtitle={t('Group A & B standings', 'ग्रुप A और B की स्थिति')}
            colors={['#00DCF5', '#5B2BF0']} onPress={() => router.navigate('/points')} 
          />
          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 4 }} />
          <IconRow 
            icon="star" title={t('MVP Race', 'MVP रेस')} subtitle={t('Car leaderboard', 'कार लीडरबोर्ड')}
            colors={['#FFC53D', '#FF8A3D']} onPress={() => router.push('/mvp')} 
          />
          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 4 }} />
          <IconRow 
            icon="heart" title={t('Fan Voting', 'फैन वोटिंग')} subtitle={t('Have your say', 'अपनी राय दें')}
            colors={['#7C5CFF', '#00DCF5']} onPress={() => router.push('/vote')} 
          />
          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 4 }} />
          <IconRow 
            icon="crosshair" title={t('How Selection Works', 'चयन प्रक्रिया')} subtitle={t('The 18 stages', '18 चरण')}
            colors={['#FF3DA6', '#FF1A75']} onPress={() => router.push('/pages/trust')} 
          />
          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 4 }} />
          <IconRow 
            icon="activity" title={t('Trial Rules', 'ट्रायल नियम')} subtitle={t('Phase 2 physical', 'फेज 2 फिजिकल')}
            colors={['#FF8A00', '#FF3D00']} onPress={() => router.push('/pages/trial-rules')} 
          />
          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 4 }} />
          <IconRow 
            icon="shield" title={t('Code of Conduct', 'आचार संहिता')} subtitle={t('Player standards', 'खिलाड़ी मानक')}
            colors={['#00E5FF', '#00B3FF']} onPress={() => router.push('/pages/code-of-conduct')} 
          />
          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 4 }} />
          <IconRow 
            icon="check-square" title={t('Eligibility Criteria', 'योग्यता मानदंड')} subtitle={t('Who can play', 'कौन खेल सकता है')}
            colors={['#00FF87', '#00C853']} onPress={() => router.push('/pages/eligibility')} 
          />
          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 4 }} />
          <IconRow 
            icon="book-open" title={t('Cricket Rulebook', 'क्रिकेट रूलबुक')} subtitle={t('Tournament rules', 'टूर्नामेंट नियम')}
            colors={['#9B2FF0', '#5B2BF0']} onPress={() => router.push('/pages/cricket-rulebook')} 
          />
        </Card>
      </View>

      <View>
        <Text style={[styles.cardTitle, { color: c.ink, marginBottom: 12 }]}>{t('Quick Answers', 'त्वरित उत्तर')}</Text>
        <Text style={{ color: c.sub, fontSize: 13, marginBottom: 16, fontFamily: 'PlusJakartaSans_500Medium' }}>TAP TO OPEN</Text>
        {FAQ_ITEMS.map((item, i) => (
          <AccordionItem key={i} title={t(item.enTitle, item.hiTitle)} body={t(item.enBody, item.hiBody)} />
        ))}
        <Pressable onPress={() => router.push('/pages/faq')} style={{ marginTop: 8, padding: 12, alignItems: 'center' }}>
          <Text style={{ color: c.magenta, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>{t('View all FAQs', 'सभी FAQ देखें')} →</Text>
        </Pressable>
      </View>

      <View>
        <Text style={[styles.cardTitle, { color: c.ink, marginBottom: 4 }]}>{t('Legal', 'कानूनी')}</Text>
        <LegalGrid />
      </View>
    </View>
  );
}

function ContactSupport() {
  const c = useColors();
  const { t } = useLang();
  const rows = [
    { icon: 'message-circle' as const, label: t('WhatsApp support', 'WhatsApp सपोर्ट'), sub: '+91 91513 46555', url: 'https://wa.me/919151346555', color: c.mint },
    { icon: 'phone' as const, label: t('Call us', 'कॉल करें'), sub: '+91 91513 46555', url: 'tel:+919151346555', color: c.orange },
    { icon: 'mail' as const, label: t('Email', 'ईमेल'), sub: 'support@bcplt20.com', url: 'mailto:support@bcplt20.com', color: c.cyan },
  ];
  return (
    <Card padding={0} border={true}>
      <View style={{ padding: 20, paddingBottom: 12 }}>
        <Text style={[styles.cardTitle, { color: c.ink, marginBottom: 12 }]}>{t('Contact & support', 'संपर्क और सहायता')}</Text>
      </View>
      <View style={{ gap: 4 }}>
        {rows.map((r, i) => (
          <Pressable
            key={r.icon}
            onPress={() => Linking.openURL(r.url)}
            style={({ pressed }) => [
              styles.supportRow,
              { paddingHorizontal: 20 },
              { opacity: pressed ? 0.7 : 1 },
              i > 0 && { borderTopWidth: 1, borderTopColor: c.line }
            ]}
            testID={`support-${r.icon}`}
          >
            <View style={[styles.supportIcon, { backgroundColor: `${r.color}20` }]}>
              <Feather name={r.icon} size={18} color={c.getAccentText(r.color)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>{r.label}</Text>
              <Text style={{ color: c.sub, fontSize: 13, marginTop: 4, fontFamily: 'PlusJakartaSans_500Medium' }}>{r.sub}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.sub} />
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

function SponsorStrip() {
  const c = useColors();
  const q = useQuery({ queryKey: ['sponsors'], queryFn: getSponsors });

  if (q.isLoading || !q.data || q.data.sponsors.length === 0) return null;

  return (
    <Card padding={0} border={true}>
      <View style={{ padding: 20, paddingBottom: 12 }}>
        <Text style={[styles.cardTitle, { color: c.ink, marginBottom: 12 }]}>Our Sponsors</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingHorizontal: 20, paddingBottom: 20 }}>
        {q.data.sponsors.map((s) => (
          <Pressable key={s.id} onPress={() => s.url && Linking.openURL(s.url)}>
            <View style={{ backgroundColor: c.card2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: c.line }}>
              <Image source={{ uri: `https://bcplt20.com${s.logo}` }} style={{ width: 80, height: 40 }} contentFit="contain" />
            </View>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

export default function ProfileScreen() {
  const c = useColors();
  const router = useRouter();
  const { token, user, ready, logout } = useAuth();
  const { t, lang } = useLang();
  
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const dashQ = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => getDashboard(token as string),
    enabled: !!token,
  });

  if (!ready) return <LoadingView />;

  if (!token) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenBackground />
      <GlassAppBar title={t('More', 'अन्य')} />
      <ScrollView contentContainerStyle={{ paddingBottom: bottomNavHeight }}>
        <View style={{ height: appBarHeight }} />
        <View style={styles.loginWrap}>
          <View style={styles.loginIconWrap}>
            <LinearGradient colors={['rgba(255, 26, 117,0.2)', 'rgba(255, 26, 117,0.05)']} style={StyleSheet.absoluteFill} />
            <Feather name="user" size={44} color={c.magenta} />
          </View>
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginTop: 24, textAlign: 'center' }}>
            {t('Log in to your BCPL account', 'अपने BCPL अकाउंट में लॉगिन करें')}
          </Text>
          <Text style={{ color: c.sub, textAlign: 'center', marginTop: 12, fontSize: 15, lineHeight: 24, fontFamily: 'PlusJakartaSans_500Medium' }}>
            {t('Use the same phone number you registered with on bcplt20.com — you will log in via OTP', 'वही फ़ोन नंबर इस्तेमाल करें जिससे आपने bcplt20.com पर रजिस्टर किया था — OTP से लॉगिन होगा')}
          </Text>
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.loginBtn, { opacity: pressed ? 0.85 : 1 }]}
            testID="login-button"
          >
            <LinearGradient
              colors={['#FF1A75', '#D10056']}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, letterSpacing: 0.5 }}>
              Login with OTP
            </Text>
          </Pressable>
          <View style={{ alignSelf: 'stretch', marginTop: 40, gap: 16 }}>
            <LangSwitch />
            <MoreMenu />
            <ContactSupport />
            <SponsorStrip />
          </View>
        </View>
        </ScrollView>
      </View>
    );
  }

  const d = dashQ.data;
  const reg = d?.registration;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={user?.name ?? 'Player'} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomNavHeight }}
        refreshControl={
          <RefreshControl refreshing={dashQ.isRefetching} onRefresh={() => dashQ.refetch()} tintColor={c.violet} progressViewOffset={appBarHeight} />
        }
      >
        <View style={{ height: appBarHeight }} />
        <View style={{ paddingHorizontal: 16, gap: 16, paddingTop: 16 }}>
          {dashQ.isLoading ? (
            <LoadingView />
          ) : dashQ.isError ? (
            <ErrorView onRetry={() => dashQ.refetch()} />
          ) : !d?.registered ? (
            <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
              <View style={[styles.loginIconWrap, { backgroundColor: 'transparent', borderColor: 'rgba(0, 229, 255, 0.3)' }]}>
                <LinearGradient colors={['rgba(0, 229, 255,0.2)', 'rgba(0, 229, 255,0.05)']} style={StyleSheet.absoluteFill} />
                <Feather name="edit-3" size={36} color={c.cyan} />
              </View>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, marginTop: 24, textAlign: 'center' }}>
                {t('Register for BCPL Season 5', 'BCPL सीज़न 5 के लिए रजिस्टर करें')}
              </Text>
              <Text style={{ color: c.sub, fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 22, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {t('Register right here in the app — your dashboard will appear once registration is complete', 'यहीं ऐप में रजिस्टर करें — रजिस्ट्रेशन पूरी होते ही आपका डैशबोर्ड यहाँ दिखेगा')}
              </Text>
              <Pressable
                onPress={() => router.push('/register')}
                style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.8 : 1 }]}
                testID="register-cta"
              >
                <LinearGradient
                  colors={['#FF1A75', '#D10056']}
                  style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                />
                <Feather name="edit-3" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15, letterSpacing: 0.5 }}>{t('Register now', 'रजिस्टर करें')}</Text>
              </Pressable>
            </Card>
          ) : (
            <>
              <Card style={{ padding: 0 }}>
                <LinearGradient colors={['rgba(255,255,255,0.05)', 'transparent']} style={{ padding: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                      <Pressable onPress={() => router.push('/profile')} testID="more-avatar" hitSlop={6}>
                        <AvatarCircle avatar={d?.avatar} size={52} />
                      </Pressable>
                      <View>
                        <Text style={{ color: c.sub, fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 1 }}>REGISTRATION NO.</Text>
                        <Text style={{ color: c.cyan, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginTop: 6, letterSpacing: -0.5 }}>
                          {reg?.regNumber ?? '—'}
                        </Text>
                      </View>
                    </View>
                    {reg?.role ? <GradientTag label={roleLabel(reg.role, lang)} color={c.amber} /> : null}
                  </View>
                  {reg?.trialCity ? (
                    <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Feather name="map-pin" size={16} color={c.magenta} />
                      <Text style={{ color: c.ink, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>
                        Trial city: <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold' }}>{reg.trialCity}</Text>
                      </Text>
                    </View>
                  ) : null}
                </LinearGradient>
              </Card>

              <Pressable
                onPress={() => router.push('/journey')}
                style={({ pressed }) => [styles.journeyCta, { opacity: pressed ? 0.9 : 1 }]}
                testID="my-journey-cta"
              >
                <LinearGradient
                  colors={['#5B2BF0', '#9B2FF0', '#FF3DA6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                />
                <View style={styles.journeyCtaIcon}>
                  <Feather name="map" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>
                    {t('My Journey', 'मेरा सफ़र')}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12.5, marginTop: 2 }}>
                    {t('Your full season timeline & status', 'आपकी पूरी सीज़न टाइमलाइन और स्थिति')}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.9)" />
              </Pressable>

              <Card style={{ padding: 0 }}>
                <View style={{ padding: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                  <Text style={[styles.cardTitle, { color: c.ink }]}>{t('Your season journey', 'आपका सीज़न सफ़र')}</Text>
                </View>
                <View style={{ padding: 20, paddingVertical: 12 }}>
                  {/* Owner rule: "Registration" is not a selection — once the player
                      is registered (paid or legacy carryover) it simply reads DONE.
                      Selection lives on the Trial video row. */}
                  <StatusRow
                    label="Phase 1 — Registration"
                    value={['selected', 'rejected', 'video_submitted', 'payment_done'].includes(reg?.phase1Status ?? '') ? 'Done' : 'Pending'}
                    done={['selected', 'rejected', 'video_submitted', 'payment_done'].includes(reg?.phase1Status ?? '')}
                    isCurrent={!['selected', 'rejected', 'video_submitted', 'payment_done'].includes(reg?.phase1Status ?? '')}
                  />
                  {/* Legacy PAID carryover players skip the skill video entirely —
                      never show the trial-video row or an upload CTA to them. */}
                  {reg?.carryover === true ? null : (
                    <>
                      <StatusRow
                        label="Trial video"
                        value={
                          reg?.phase1Status === 'selected'
                            ? 'Selected' // qualified (video round cleared)
                            : reg?.phase1Status === 'rejected'
                              ? 'Not selected'
                              : d.video?.submitted ? 'Submitted' : 'Pending'
                        }
                        done={!!d.video?.submitted || reg?.phase1Status === 'selected'}
                        isCurrent={['video_submitted', 'payment_done'].includes(reg?.phase1Status ?? '') && !d.video?.submitted}
                      />
                      {!d.video?.submitted && ['video_submitted', 'payment_done'].includes(reg?.phase1Status ?? '') ? (
                        <Pressable
                          onPress={() => router.push('/upload-video')}
                          style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.8 : 1, marginTop: 8, marginBottom: 16 }]}
                          testID="upload-video-cta"
                        >
                          <LinearGradient
                            colors={['#FF1A75', '#D10056']}
                            style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                          />
                          <Feather name="video" size={18} color="#fff" />
                          <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }}>{t('Upload trial video', 'ट्रायल वीडियो अपलोड करें')}</Text>
                        </Pressable>
                      ) : null}
                    </>
                  )}
                  <StatusRow
                    label="Phase 2 — KYC"
                    value={
                      isKycDone(d.kyc?.status, reg?.phase2Status)
                        ? 'Complete'
                        : d.kyc?.status === 'pending'
                          ? 'Under review'
                          : (d.kyc?.status ?? reg?.phase2Status)
                            ? niceStatus(d.kyc?.status ?? reg?.phase2Status)
                            : 'Pending' // KYC not yet started → 'Pending' (owner rule)
                    }
                    done={isKycDone(d.kyc?.status, reg?.phase2Status)}
                    isCurrent={!!d.video?.submitted && !isKycDone(d.kyc?.status, reg?.phase2Status)}
                  />
                  <StatusRow
                    label="Physical trial"
                    value={
                      d.trial?.assessmentSubmitted
                        ? 'Assessment done'
                        : d.trial
                          ? `${d.trial.venue?.name ?? 'Allocated'}${d.trial.slot?.batch ? ` · ${d.trial.slot.batch}` : ''}`
                          : 'Awaited'
                    }
                    done={!!d.trial?.assessmentSubmitted}
                    isCurrent={isKycDone(d.kyc?.status, reg?.phase2Status) && !d.trial?.assessmentSubmitted}
                  />
                </View>
              </Card>

              {(d.phase1Payment || d.phase2Payment) && (
                <Card style={{ padding: 0 }}>
                  <View style={{ padding: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                    <Text style={[styles.cardTitle, { color: c.ink }]}>Payments</Text>
                  </View>
                  <View style={{ padding: 20, paddingVertical: 12 }}>
                    {d.phase1Payment ? (
                      <StatusRow
                        label={`Phase 1 — ₹${d.phase1Payment.amount}`}
                        value={niceStatus(d.phase1Payment.status)}
                        done={d.phase1Payment.status === 'success' || d.phase1Payment.status === 'paid'}
                      />
                    ) : null}
                    {d.phase2Payment ? (
                      <StatusRow
                        label={`Phase 2 — ₹${d.phase2Payment.amount}`}
                        value={niceStatus(d.phase2Payment.status)}
                        done={d.phase2Payment.status === 'success' || d.phase2Payment.status === 'paid'}
                      />
                    ) : null}
                  </View>
                </Card>
              )}
            </>
          )}

          <LangSwitch />
          <MoreMenu />
          <ContactSupport />
          <SponsorStrip />

          <Pressable
            onPress={() => logout()}
            style={({ pressed }) => [
              styles.logoutBtn,
              { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: 'rgba(255, 59, 48, 0.3)', opacity: pressed ? 0.7 : 1 },
            ]}
            testID="logout-button"
          >
            <Feather name="log-out" size={18} color={c.coral} />
            <Text style={{ color: c.coral, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  supportRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
  prefIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  supportIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 229, 255, 0.15)', alignItems: 'center', justifyContent: 'center' },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 24,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  loginWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loginIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 26, 117,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loginBtn: {
    marginTop: 36,
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 18,
    alignSelf: 'stretch',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#FF1A75',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, letterSpacing: -0.2 },
  journeyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
  },
  journeyCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  statusIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusValuePill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 8,
    marginBottom: 20,
  },
});
