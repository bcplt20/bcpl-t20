import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getAiFeedback, getDashboard, getMyResult, type AiTip, type Phase1BreakdownItem } from '@/lib/api';
import {
  Card,
  ErrorView,
  LoadingView,
  ScreenBackground,
  GlassAppBar,
  useAppBarHeight,
} from '@/components/ui';

/**
 * PHASE 1 RESULT — native scorecard mirroring the website's Phase1Result page.
 *
 * Both outcomes get the same scorecard experience (total /100, city & role
 * ranks, per-category breakdown bars, selector note). Qualified players get a
 * Continue-to-Phase-2 CTA; not-shortlisted players get a neutral encouragement
 * card and NO payment CTA. No reveal animations. Copy stays neutral
 * ("shortlisted नहीं हुए"), never claims/superlatives/guarantees.
 */

/** Prettify a legacy breakdown key that has no server label ("roleSkill" → "Role Skill"). */
function prettifyKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return spaced.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function BreakdownRow({ item }: { item: Phase1BreakdownItem }) {
  const c = useColors();
  const max = item.max > 0 ? item.max : 1;
  const frac = Math.max(0, Math.min(1, item.score / max));
  const label = item.label && item.label.trim() ? item.label : prettifyKey(item.key);
  return (
    <View style={{ paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13.5, flex: 1 }}>{label}</Text>
        <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14, fontVariant: ['tabular-nums'] }}>
          {item.score}
          <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12 }}> / {item.max}</Text>
        </Text>
      </View>
      <View style={{ height: 7, borderRadius: 4, backgroundColor: c.card2, overflow: 'hidden' }}>
        <LinearGradient
          colors={['#7C5CFF', '#FF3DA6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${Math.round(frac * 100)}%`, height: '100%', borderRadius: 4 }}
        />
      </View>
    </View>
  );
}

function RankBox({ label, rank, count }: { label: string; rank: number; count?: number | null }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.card2, borderRadius: 16, borderWidth: 1, borderColor: c.line, padding: 14 }}>
      <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' }} numberOfLines={1}>
        {label}
      </Text>
      <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, marginTop: 6, fontVariant: ['tabular-nums'] }}>
        #{rank}
        {count ? <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}> / {count}</Text> : null}
      </Text>
    </View>
  );
}

export default function ResultScreen() {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const { token, ready } = useAuth();
  const appBarHeight = useAppBarHeight();

  const rq = useQuery({
    queryKey: ['result', token],
    queryFn: () => getMyResult(token as string),
    enabled: !!token,
  });

  // Dashboard is used only to know if the player is qualified when the detailed
  // scorecard is not ready yet — so we can still surface the Phase-2 CTA (the
  // website behaves the same way in its "being finalised" state).
  const dq = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => getDashboard(token as string),
    enabled: !!token,
  });

  // AI Coach practice tips — best-effort; card simply stays hidden when the
  // AI helper is unavailable (503) or the result is not scored yet (404).
  const aiQ = useQuery({
    queryKey: ['ai-feedback', token],
    queryFn: () => getAiFeedback(token as string),
    enabled: !!token && !!rq.data?.available,
    retry: false,
    staleTime: Infinity,
  });

  const refetch = rq.refetch;
  useFocusEffect(
    useCallback(() => {
      if (token) refetch();
    }, [token, refetch]),
  );

  const Header = (
    <>
      <ScreenBackground />
      <GlassAppBar title={t('Phase 1 Result', 'फेज 1 रिज़ल्ट')} back={true} />
    </>
  );

  if (!ready) return <LoadingView />;

  if (!token) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: appBarHeight }}>
          <Feather name="lock" size={28} color={c.magenta} />
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
            {t('Log in to see your result', 'अपना रिज़ल्ट देखने के लिए लॉगिन करें')}
          </Text>
        </View>
      </View>
    );
  }

  if (rq.isLoading) return (<View style={{ flex: 1, backgroundColor: c.bg }}>{Header}<LoadingView /></View>);
  if (rq.isError && !rq.data) return (<View style={{ flex: 1, backgroundColor: c.bg }}>{Header}<ErrorView onRetry={() => rq.refetch()} /></View>);

  const r = rq.data;
  const qualifiedByDash = dq.data?.registration?.phase1Status === 'selected';

  // ── Result not available yet (available:false) — branch on server reason ──
  if (!r || !r.available) {
    const reason = r && !r.available ? (r as { reason?: string }).reason : undefined;
    const pendingCopy: Record<string, [string, string]> = {
      not_registered: ['Register for Phase 1 to get your result here.', 'फेज 1 रजिस्ट्रेशन करने के बाद आपका रिज़ल्ट यहाँ दिखेगा।'],
      payment_pending: ['Complete your Phase 1 payment first — your result comes after your video is reviewed.', 'पहले फेज 1 का payment पूरा करें — वीडियो review होने के बाद रिज़ल्ट यहाँ आएगा।'],
      video_pending: ['Upload your trial video first. Your result will appear here within 15 days of submission — usually much sooner.', 'पहले अपना ट्रायल वीडियो अपलोड करें। Submit के 15 दिनों के अंदर result यहाँ आ जाएगा — अक्सर काफ़ी पहले।'],
      under_review: ['Your video is under review. Your result will appear here within 15 days of submission — usually much sooner.', 'आपका वीडियो review में है। Submit के 15 दिनों के अंदर result यहाँ आ जाएगा — अक्सर काफ़ी पहले।'],
      score_pending: ['Your Phase 1 decision has been announced via SMS and email. Your detailed 100-point scorecard will appear here shortly.', 'आपका फेज 1 निर्णय SMS और ईमेल से घोषित कर दिया गया है। आपका विस्तृत 100-पॉइंट स्कोरकार्ड जल्द ही यहाँ दिखाई देगा।'],
    };
    const isScorePending = reason === 'score_pending';
    const title: [string, string] = isScorePending
      ? ['Scorecard is being prepared', 'स्कोरकार्ड तैयार हो रहा है']
      : ['Result not available yet', 'रिज़ल्ट अभी उपलब्ध नहीं है'];
    const body = pendingCopy[reason ?? ''] ?? ['Your result will appear here once your Phase 1 review is complete.', 'फेज 1 review पूरा होते ही आपका रिज़ल्ट यहाँ दिखेगा।'];
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: appBarHeight + 40, alignItems: 'center' }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <LinearGradient colors={['#7C5CFF', '#FF3DA6']} style={StyleSheet.absoluteFill} />
            <Feather name="file-text" size={36} color="#fff" />
          </View>
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, marginTop: 18, textAlign: 'center' }}>
            {t(title[0], title[1])}
          </Text>
          <Text style={{ color: c.sub, fontSize: 13.5, marginTop: 10, textAlign: 'center', lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium', maxWidth: 340 }}>
            {t(body[0], body[1])}
          </Text>

          {isScorePending && qualifiedByDash ? (
            <Pressable onPress={() => router.push('/phase2-pay')} style={({ pressed }) => [styles.btn, { marginTop: 24, opacity: pressed ? 0.85 : 1 }]} testID="result-phase2-cta">
              <LinearGradient colors={['#16E0A3', '#00B8D9']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Feather name="arrow-right" size={16} color="#fff" />
              <Text style={styles.btnText}>{t('Continue to Phase 2', 'फेज 2 के लिए आगे बढ़ें')}</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={() => router.replace('/journey')} style={{ marginTop: 18 }}>
            <Text style={{ color: c.sub, fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Back to my journey', 'मेरे सफ़र पर वापस')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const qualified = r.decision === 'qualified';
  const aiTips = aiQ.data?.tips ?? null;
  const total = r.total ?? 0;
  const breakdown = r.breakdown ?? [];
  const showCity = r.cityRank != null;
  const showRole = r.roleRank != null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: appBarHeight + 8, paddingBottom: 60 }}>
        <LinearGradient colors={['#5B2BF0', '#9B2FF0', '#FF3DA6']} style={{ width: 48, height: 4, borderRadius: 2, marginBottom: 12 }} />

        {/* Decision badge */}
        <View style={{
          alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
          borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1,
          backgroundColor: qualified ? 'rgba(22,224,163,0.14)' : 'rgba(124,92,255,0.14)',
          borderColor: qualified ? 'rgba(22,224,163,0.4)' : 'rgba(124,92,255,0.4)',
        }}>
          <Feather name={qualified ? 'award' : 'flag'} size={13} color={qualified ? c.mint : c.violet} />
          <Text style={{ color: qualified ? c.mint : c.violet, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11.5, letterSpacing: 0.3 }}>
            {qualified
              ? t('Phase 1 Qualified — Phase 2 के लिए आगे बढ़ें', 'फेज 1 क्वालिफाइड — फेज 2 के लिए आगे बढ़ें')
              : t('Phase 1 Assessment Complete', 'फेज 1 असेसमेंट पूरा')}
          </Text>
        </View>

        {r.name ? (
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginTop: 14, letterSpacing: -0.5 }}>
            {r.name}
          </Text>
        ) : null}
        <Text style={{ color: c.sub, fontSize: 13, marginTop: 2, fontFamily: 'PlusJakartaSans_500Medium' }}>
          {[r.regNumber, r.trialCity].filter(Boolean).join('  ·  ')}
        </Text>

        {/* Total score /100 */}
        <Card style={{ marginTop: 18, alignItems: 'center', paddingVertical: 28 }}>
          <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
            {t('BCPL Score', 'BCPL स्कोर')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 }}>
            <MaskedScore total={total} />
            <Text style={{ color: c.sub, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 26, marginBottom: 10 }}> / 100</Text>
          </View>
          <View style={{ width: '80%', height: 8, borderRadius: 4, backgroundColor: c.card2, overflow: 'hidden', marginTop: 14 }}>
            <LinearGradient colors={['#7C5CFF', '#FF3DA6', '#00DCF5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${Math.max(0, Math.min(100, total))}%`, height: '100%', borderRadius: 4 }} />
          </View>
        </Card>

        {/* Ranks */}
        {showCity || showRole ? (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            {showCity ? (
              <RankBox
                label={r.trialCity ? t(`${r.trialCity} rank`, `${r.trialCity} रैंक`) : t('City rank', 'शहर रैंक')}
                rank={r.cityRank as number}
                count={r.cityCount}
              />
            ) : null}
            {showRole ? (
              <RankBox label={t('Role rank', 'रोल रैंक')} rank={r.roleRank as number} count={r.roleCount} />
            ) : null}
          </View>
        ) : null}

        {/* Category breakdown */}
        {breakdown.length ? (
          <Card style={{ marginTop: 14 }}>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, marginBottom: 4 }}>
              {t('Category breakdown', 'श्रेणी विवरण')}
            </Text>
            {breakdown.map((item, i) => (
              <BreakdownRow key={item.key || String(i)} item={item} />
            ))}
          </Card>
        ) : null}

        {/* Selector note */}
        {r.selectorNote ? (
          <Card style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Feather name="message-square" size={16} color={c.cyan} />
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }}>
                {t('Evaluator note', 'मूल्यांकनकर्ता की टिप्पणी')}
              </Text>
            </View>
            <Text style={{ color: c.sub, fontSize: 13.5, lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium' }}>
              {r.selectorNote}
            </Text>
          </Card>
        ) : null}

        {/* AI Coach practice tips */}
        {aiTips && aiTips.length > 0 ? (
          <Card style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                <LinearGradient colors={['#7C5CFF', '#FF3DA6']} style={StyleSheet.absoluteFill} />
                <Feather name="zap" size={15} color="#fff" />
              </View>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>
                {t('AI Coach — Practice tips', 'AI कोच — अभ्यास के सुझाव')}
              </Text>
            </View>
            {aiTips.map((tip: AiTip, i: number) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: i < aiTips.length - 1 ? 12 : 0 }}>
                <View style={{ minWidth: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(124,92,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: c.violet, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11.5 }}>{i + 1}</Text>
                </View>
                <Text style={{ flex: 1, color: c.sub, fontSize: 13.5, lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium' }}>
                  {t(tip.en, tip.hi)}
                </Text>
              </View>
            ))}
            <Text style={{ color: c.sub, fontSize: 11, marginTop: 12, opacity: 0.7, fontFamily: 'PlusJakartaSans_500Medium' }}>
              {t('Personalised from your score breakdown. Practice guidance only.', 'आपके score breakdown से तैयार। केवल अभ्यास मार्गदर्शन के लिए।')}
            </Text>
          </Card>
        ) : null}

        {/* Outcome-specific footer */}
        {qualified ? (
          <>
            <Card style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Feather name="star" size={18} color={c.mint} />
                <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, flex: 1 }}>
                  {t('You have qualified for Phase 2', 'आप फेज 2 के लिए क्वालिफाई कर गए हैं')}
                </Text>
              </View>
              <Text style={{ color: c.sub, fontSize: 13.5, lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {t('Continue your Phase 2 registration and pay the trial fee for the physical trial.', 'फेज 2 रजिस्ट्रेशन जारी रखें और फिजिकल ट्रायल के लिए ट्रायल फीस भरें।')}
              </Text>
            </Card>
            <Pressable onPress={() => router.push('/phase2-pay')} style={({ pressed }) => [styles.btn, { marginTop: 18, opacity: pressed ? 0.85 : 1 }]} testID="result-phase2-cta">
              <LinearGradient colors={['#16E0A3', '#00B8D9']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Feather name="arrow-right" size={16} color="#fff" />
              <Text style={styles.btnText}>{t('Continue to Phase 2', 'फेज 2 के लिए आगे बढ़ें')}</Text>
            </Pressable>
          </>
        ) : (
          <Card style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Feather name="compass" size={18} color={c.orange} />
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, flex: 1 }}>
                {t('Your journey doesn\'t end here', 'आपका journey यहीं खत्म नहीं होता')}
              </Text>
            </View>
            <Text style={{ color: c.sub, fontSize: 13.5, lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium' }}>
              {t('You completed the full Phase 1 assessment this season. You were not shortlisted for Phase 2 this time — use the scorecard above to see exactly where to improve.', 'आपने इस सीज़न का पूरा फेज 1 असेसमेंट पूरा किया। इस बार आप फेज 2 के लिए shortlist नहीं हुए — ऊपर दिए स्कोरकार्ड से देखें कि कहाँ सुधार करना है।')}
            </Text>
            <View style={{ marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: c.card2, borderWidth: 1, borderColor: c.line }}>
              <Text style={{ color: c.sub, fontSize: 13, lineHeight: 20, fontFamily: 'PlusJakartaSans_500Medium' }}>
                {t('Season 6 registrations will open soon — keep training and come back stronger.', 'सीज़न 6 रजिस्ट्रेशन जल्द खुलेंगे — तैयारी जारी रखें और और मज़बूत होकर लौटें।')}
              </Text>
            </View>
          </Card>
        )}

        <Pressable onPress={() => router.replace('/journey')} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: c.sub, fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>{t('Back to my journey', 'मेरे सफ़र पर वापस')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/** Big gradient-accented score number. */
function MaskedScore({ total }: { total: number }) {
  const c = useColors();
  return (
    <Text style={{ color: c.magenta, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 76, letterSpacing: -2, lineHeight: 82, fontVariant: ['tabular-nums'] }}>
      {total}
    </Text>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, overflow: 'hidden',
  },
  btnText: { color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 },
});
