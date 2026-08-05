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
import { getDashboard } from '@/lib/api';
import { Badge, Card, ErrorView, LoadingView } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LinearGradient } from 'expo-linear-gradient';

function StatusRow({ label, value, done, isCurrent }: { label: string; value: string; done?: boolean; isCurrent?: boolean }) {
  const c = useColors();
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusIconWrap, done && { backgroundColor: 'rgba(49, 197, 107, 0.2)' }, isCurrent && !done && { backgroundColor: 'rgba(232, 178, 61, 0.2)' }]}>
        <Feather
          name={done ? 'check-circle' : isCurrent ? 'clock' : 'circle'}
          size={18}
          color={done ? c.success : isCurrent ? c.accent : 'rgba(255,255,255,0.2)'}
        />
      </View>
      <Text style={{ color: done || isCurrent ? c.foreground : c.mutedForeground, fontSize: 14.5, flex: 1, fontFamily: 'Inter_700Bold' }}>{label}</Text>
      <View style={[styles.statusValuePill, done && { backgroundColor: 'rgba(49, 197, 107, 0.15)', borderColor: 'rgba(49, 197, 107, 0.4)' }, isCurrent && !done && { backgroundColor: 'rgba(232, 178, 61, 0.15)', borderColor: 'rgba(232, 178, 61, 0.4)' }]}>
        <Text style={{ color: done ? c.success : isCurrent ? c.accent : c.mutedForeground, fontSize: 12, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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

function LangSwitch() {
  const c = useColors();
  const { lang, setLang, t } = useLang();
  const opts: { value: Lang; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिंदी' },
  ];
  return (
    <Card>
      <Text style={[styles.cardTitle, { color: c.foreground }]}>{t('Language', 'भाषा')}</Text>
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
                  borderColor: isActive ? c.primary : 'rgba(255,255,255,0.1)',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              testID={`lang-${o.value}`}
            >
              {isActive ? (
                <LinearGradient colors={['#FF6B00', '#D95A00']} style={StyleSheet.absoluteFill} />
              ) : (
                <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} />
              )}
              <Text
                style={{
                  color: isActive ? '#fff' : c.mutedForeground,
                  fontFamily: isActive ? 'Inter_700Bold' : 'Inter_600SemiBold',
                  fontSize: 14,
                }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const LEGAL_LINKS: { en: string; hi: string; path: string }[] = [
  { en: 'How Selection Works', hi: 'चयन प्रक्रिया', path: '/trust' },
  { en: 'Eligibility Criteria', hi: 'योग्यता मानदंड', path: '/eligibility' },
  { en: 'Physical Trial Rules', hi: 'फिज़िकल ट्रायल नियम', path: '/trial-rules' },
  { en: 'Cricket Rulebook', hi: 'क्रिकेट रूलबुक', path: '/cricket-rulebook' },
  { en: 'Code of Conduct', hi: 'आचार संहिता', path: '/code-of-conduct' },
  { en: 'FAQ', hi: 'सामान्य प्रश्न', path: '/faq' },
  { en: 'Terms & Conditions', hi: 'नियम और शर्तें', path: '/terms' },
  { en: 'Privacy Policy', hi: 'प्राइवेसी पॉलिसी', path: '/privacy' },
  { en: 'Refund & Cancellation Policy', hi: 'रिफंड और कैंसिलेशन पॉलिसी', path: '/refunds' },
  { en: 'Brand & Logo Usage', hi: 'ब्रांड और लोगो उपयोग नीति', path: '/brand-usage' },
];

function LegalLinks() {
  const c = useColors();
  const { t } = useLang();
  return (
    <Card>
      <Text style={[styles.cardTitle, { color: c.foreground, marginBottom: 12 }]}>{t('Rules & policies', 'नियम और नीतियाँ')}</Text>
      <View>
        {LEGAL_LINKS.map((l, i) => (
          <Pressable
            key={l.path}
            onPress={() => WebBrowser.openBrowserAsync(`https://bcplt20.com${l.path}`)}
            style={({ pressed }) => [
              styles.supportRow,
              i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)' },
              { opacity: pressed ? 0.7 : 1 },
            ]}
            testID={`legal-${l.path.slice(1)}`}
          >
            <Text style={{ color: c.secondaryForeground, fontSize: 14, fontFamily: 'Inter_600SemiBold', flex: 1 }}>
              {t(l.en, l.hi)}
            </Text>
            <Feather name="chevron-right" size={16} color={c.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

function ContactSupport() {
  const c = useColors();
  const { t } = useLang();
  const rows = [
    { icon: 'message-circle' as const, label: t('WhatsApp support', 'WhatsApp सपोर्ट'), sub: '+91 91513 46555', url: 'https://wa.me/919151346555' },
    { icon: 'phone' as const, label: t('Call us', 'कॉल करें'), sub: '+91 91513 46555', url: 'tel:+919151346555' },
    { icon: 'mail' as const, label: t('Email', 'ईमेल'), sub: 'support@bcplt20.com', url: 'mailto:support@bcplt20.com' },
  ];
  return (
    <Card>
      <Text style={[styles.cardTitle, { color: c.foreground, marginBottom: 12 }]}>{t('Contact & support', 'संपर्क और सहायता')}</Text>
      <View style={{ gap: 4 }}>
        {rows.map((r, i) => (
          <Pressable
            key={r.icon}
            onPress={() => Linking.openURL(r.url)}
            style={({ pressed }) => [
              styles.supportRow,
              { opacity: pressed ? 0.7 : 1 },
              i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' }
            ]}
            testID={`support-${r.icon}`}
          >
            <View style={styles.supportIcon}>
              <Feather name={r.icon} size={18} color="#E8B23D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 15 }}>{r.label}</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 13, marginTop: 4, fontFamily: 'Inter_500Medium' }}>{r.sub}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.mutedForeground} />
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
  const { t } = useLang();

  const dashQ = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => getDashboard(token as string),
    enabled: !!token,
  });

  if (!ready) return <LoadingView />;

  if (!token) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : 120 }}>
        <ScreenHeader title="Profile" />
        <View style={styles.loginWrap}>
          <View style={styles.loginIconWrap}>
            <LinearGradient colors={['rgba(255,107,0,0.2)', 'rgba(255,107,0,0.05)']} style={StyleSheet.absoluteFill} />
            <Feather name="user" size={44} color={c.primary} />
          </View>
          <Text style={{ color: c.foreground, fontFamily: 'Inter_800ExtraBold', fontSize: 24, marginTop: 24, textAlign: 'center' }}>
            {t('Log in to your BCPL account', 'अपने BCPL अकाउंट में लॉगिन करें')}
          </Text>
          <Text style={{ color: c.mutedForeground, textAlign: 'center', marginTop: 12, fontSize: 15, lineHeight: 24, fontFamily: 'Inter_500Medium' }}>
            {t('Use the same phone number you registered with on bcplt20.com — you will log in via OTP', 'वही फ़ोन नंबर इस्तेमाल करें जिससे आपने bcplt20.com पर रजिस्टर किया था — OTP से लॉगिन होगा')}
          </Text>
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.loginBtn, { opacity: pressed ? 0.85 : 1 }]}
            testID="login-button"
          >
            <LinearGradient
              colors={['#FF6B00', '#D95A00']}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            <Text style={{ color: '#fff', fontFamily: 'Inter_800ExtraBold', fontSize: 16, letterSpacing: 0.5 }}>
              Login with OTP
            </Text>
          </Pressable>
          <View style={{ alignSelf: 'stretch', marginTop: 40, gap: 16 }}>
            <LangSwitch />
            <ContactSupport />
            <LegalLinks />
          </View>
        </View>
        </ScrollView>
      </View>
    );
  }

  const d = dashQ.data;
  const reg = d?.registration;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : 120 }}
        refreshControl={
          <RefreshControl refreshing={dashQ.isRefetching} onRefresh={() => dashQ.refetch()} tintColor={c.primary} />
        }
      >
        <ScreenHeader title={user?.name ?? 'Player'} subtitle={user?.phone} />
        <View style={{ paddingHorizontal: 16, gap: 16, paddingTop: 16 }}>
          {dashQ.isLoading ? (
            <LoadingView />
          ) : dashQ.isError ? (
            <ErrorView onRetry={() => dashQ.refetch()} />
          ) : !d?.registered ? (
            <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
              <View style={[styles.loginIconWrap, { backgroundColor: 'transparent', borderColor: 'rgba(232, 178, 61, 0.3)' }]}>
                <LinearGradient colors={['rgba(232,178,61,0.2)', 'rgba(232,178,61,0.05)']} style={StyleSheet.absoluteFill} />
                <Feather name="edit-3" size={36} color={c.accent} />
              </View>
              <Text style={{ color: c.foreground, fontFamily: 'Inter_800ExtraBold', fontSize: 20, marginTop: 24, textAlign: 'center' }}>
                {t("Register for this season on bcplt20.com", 'इस सीज़न की रजिस्ट्रेशन bcplt20.com पर करें')}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 22, fontFamily: 'Inter_500Medium' }}>
                {t('Your dashboard will appear here once registration is complete', 'रजिस्ट्रेशन पूरी होते ही आपका डैशबोर्ड यहाँ दिखेगा')}
              </Text>
              <Pressable
                onPress={() => router.push('/register')}
                style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.8 : 1 }]}
                testID="register-cta"
              >
                <LinearGradient
                  colors={['#FF6B00', '#D95A00']}
                  style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                />
                <Feather name="edit-3" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontFamily: 'Inter_800ExtraBold', fontSize: 15, letterSpacing: 0.5 }}>{t('Register now', 'रजिस्टर करें')}</Text>
              </Pressable>
            </Card>
          ) : (
            <>
              <Card style={{ padding: 0 }}>
                <LinearGradient colors={['rgba(255,255,255,0.05)', 'transparent']} style={{ padding: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: c.mutedForeground, fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1 }}>REGISTRATION NO.</Text>
                      <Text style={{ color: c.accent, fontFamily: 'Inter_800ExtraBold', fontSize: 28, marginTop: 6, letterSpacing: -0.5 }}>
                        {reg?.regNumber ?? '—'}
                      </Text>
                    </View>
                    {reg?.role ? <Badge label={reg.role} tone="gold" /> : null}
                  </View>
                  {reg?.trialCity ? (
                    <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Feather name="map-pin" size={16} color={c.primary} />
                      <Text style={{ color: c.foreground, fontSize: 14, fontFamily: 'Inter_500Medium' }}>
                        Trial city: <Text style={{ fontFamily: 'Inter_800ExtraBold' }}>{reg.trialCity}</Text>
                      </Text>
                    </View>
                  ) : null}
                </LinearGradient>
              </Card>

              <Card style={{ padding: 0 }}>
                <View style={{ padding: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                  <Text style={[styles.cardTitle, { color: c.foreground }]}>{t('Your season journey', 'आपका सीज़न सफ़र')}</Text>
                </View>
                <View style={{ padding: 20, paddingVertical: 12 }}>
                  <StatusRow
                    label="Phase 1 — Registration"
                    value={niceStatus(reg?.phase1Status)}
                    done={['selected', 'rejected', 'video_submitted', 'payment_done'].includes(reg?.phase1Status ?? '')}
                    isCurrent={!['selected', 'rejected', 'video_submitted', 'payment_done'].includes(reg?.phase1Status ?? '')}
                  />
                  <StatusRow
                    label="Trial video"
                    value={d.video?.submitted ? 'Submitted' : 'Pending'}
                    done={!!d.video?.submitted}
                    isCurrent={['video_submitted', 'payment_done'].includes(reg?.phase1Status ?? '') && !d.video?.submitted}
                  />
                  {!d.video?.submitted && ['video_submitted', 'payment_done'].includes(reg?.phase1Status ?? '') ? (
                    <Pressable
                      onPress={() => Linking.openURL('https://bcplt20.com/dashboard')}
                      style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.8 : 1, marginTop: 8, marginBottom: 16 }]}
                      testID="upload-video-cta"
                    >
                      <LinearGradient
                        colors={['#FF6B00', '#D95A00']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                      />
                      <Feather name="video" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontFamily: 'Inter_800ExtraBold', fontSize: 15 }}>{t('Upload trial video', 'ट्रायल वीडियो अपलोड करें')}</Text>
                    </Pressable>
                  ) : null}
                  <StatusRow
                    label="Phase 2 — KYC"
                    value={niceStatus(d.kyc?.status ?? reg?.phase2Status)}
                    done={(d.kyc?.status ?? '') === 'approved'}
                    isCurrent={!!d.video?.submitted && (d.kyc?.status ?? '') !== 'approved'}
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
                    isCurrent={(d.kyc?.status ?? '') === 'approved' && !d.trial?.assessmentSubmitted}
                  />
                </View>
              </Card>

              {(d.phase1Payment || d.phase2Payment) && (
                <Card style={{ padding: 0 }}>
                  <View style={{ padding: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                    <Text style={[styles.cardTitle, { color: c.foreground }]}>Payments</Text>
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
          <ContactSupport />
          <LegalLinks />

          <Pressable
            onPress={() => logout()}
            style={({ pressed }) => [
              styles.logoutBtn,
              { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: 'rgba(255, 59, 48, 0.3)', opacity: pressed ? 0.7 : 1 },
            ]}
            testID="logout-button"
          >
            <Feather name="log-out" size={18} color={c.destructive} />
            <Text style={{ color: c.destructive, fontFamily: 'Inter_800ExtraBold', fontSize: 15 }}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  supportRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 },
  supportIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(232, 178, 61, 0.15)', alignItems: 'center', justifyContent: 'center' },
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
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  loginIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,107,0,0.3)',
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
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 18, letterSpacing: -0.2 },
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
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
