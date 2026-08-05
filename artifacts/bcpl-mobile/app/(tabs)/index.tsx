import React from 'react';
import {
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
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getMatches, getPointsTable, SITE_ASSETS, type Match } from '@/lib/api';
import { NEWS_ARTICLES } from '@/data/news';
import { Badge, Card, TeamLogo } from '@/components/ui';
import { MatchCard } from '@/components/MatchCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function pickFeatured(matches: Match[]): Match[] {
  const live = matches.filter((m) => m.status === 'live');
  if (live.length > 0) return live.slice(0, 2);
  const upcoming = matches
    .filter((m) => m.status !== 'completed' && m.status !== 'live')
    .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''));
  const recent = matches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => (b.scheduledAt ?? '').localeCompare(a.scheduledAt ?? ''));
  return [...upcoming.slice(0, 1), ...recent.slice(0, 1)];
}

/** Counts a stat value up from 0 the first time it appears (e.g. "2,50,000+", "₹14 Cr+"). */
function CountUpStat({ value, style }: { value: string; style?: any }) {
  const m = value.match(/^([^\d]*)([\d,]+)(.*)$/);
  const target = m ? parseInt(m[2].replace(/,/g, ''), 10) : 0;
  const [n, setN] = React.useState(m ? 0 : target);
  React.useEffect(() => {
    if (!m || target <= 0) return;
    const dur = 1200;
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p >= 1) clearInterval(id);
    }, 80);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  if (!m) return <Text style={style}>{value}</Text>;
  const grouped = n.toLocaleString('en-IN');
  return (
    <Text style={style}>
      {m[1]}
      {grouped}
      {m[3]}
    </Text>
  );
}

/** Live countdown to registration close. Keep in sync with the website's Season-5 window (Oct '26 – Feb '27). */
const REG_CLOSE_AT = new Date('2027-02-28T23:59:59+05:30').getTime();

function RegCountdown() {
  const { t } = useLang();
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const left = REG_CLOSE_AT - now;
  if (left <= 0) return null;
  const d = Math.floor(left / 86_400_000);
  const h = Math.floor((left % 86_400_000) / 3_600_000);
  const mi = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  const two = (x: number) => String(x).padStart(2, '0');
  return (
    <View style={styles.cdWrap}>
      <Feather name="clock" size={12} color="#E8B23D" />
      <Text style={styles.cdLabel}>{t('Registration closes in', 'रजिस्ट्रेशन बंद होने में')}</Text>
      <Text style={styles.cdTime}>
        {d}d {two(h)}:{two(mi)}:{two(s)}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const c = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLang();

  const matchesQ = useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
    refetchInterval: 60_000,
  });
  const pointsQ = useQuery({ queryKey: ['points'], queryFn: getPointsTable });

  const matches = matchesQ.data?.matches ?? [];
  const featured = pickFeatured(matches);
  const topTeams = (pointsQ.data?.table ?? []).slice(0, 3);
  const latestNews = NEWS_ARTICLES.slice(0, 2);
  const anyLive = matches.some((m) => m.status === 'live');

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : 100 }}
        refreshControl={
          <RefreshControl
            refreshing={matchesQ.isRefetching}
            onRefresh={() => {
              matchesQ.refetch();
              pointsQ.refetch();
            }}
            tintColor={c.primary}
          />
        }
      >
        <ScreenHeader
          title={user ? t(`Hello, ${user.name.split(' ')[0]}`, `नमस्ते, ${user.name.split(' ')[0]}`) : 'Bhartiya Corporate Premier League'}
          subtitle="#OfficeSeStadiumTak"
          subtitleColor="#FF6B00"
        />

        {/* Register hero banner */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Pressable onPress={() => router.push('/register')} testID="hero-register" style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
            <View style={styles.hero}>
              <Image
                source={{ uri: `${SITE_ASSETS}/bcpl-assets/stadium-hero.jpg` }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
              />
              <LinearGradient
                colors={['#070C1A', 'rgba(7,12,26,0.85)', 'rgba(7,12,26,0.3)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Vibrant purple/maroon accent */}
              <LinearGradient
                colors={['rgba(255,107,0,0)', 'rgba(255,107,0,0.2)', 'rgba(168,85,247,0.3)']}
                start={{ x: 0.3, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Image
                source={require('../../assets/images/ganguly-cutout.png')}
                style={styles.heroGanguly}
                contentFit="contain"
                contentPosition="bottom right"
              />
              <LinearGradient
                colors={['transparent', 'rgba(7,12,26,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFill, { top: '60%' }]}
              />
              <View pointerEvents="none" style={styles.heroFrame} />
              
              <View style={{ padding: 22, paddingRight: 155, minHeight: 224, justifyContent: 'center' }}>
                <View style={styles.heroKickBadge}>
                  <Text style={styles.heroKick}>SEASON 5 · {t('REGISTRATIONS OPEN', 'रजिस्ट्रेशन शुरू')}</Text>
                </View>
                <Text style={styles.heroFee}>₹299<Text style={styles.heroFeeGst}> +GST</Text></Text>
                <Text style={styles.heroFeeSub}>{t('Batsman · Bowler · Wicketkeeper', 'बल्लेबाज़ · गेंदबाज़ · विकेटकीपर')}</Text>
                
                <View style={styles.heroFeeDivider} />
                
                <Text style={styles.heroFeeSub}>₹399 +GST · {t('All-Rounder', 'ऑलराउंडर')}</Text>
                
                <View style={{ marginTop: 18 }}>
                  <LinearGradient
                    colors={['#FF8A00', '#E55900']}
                    style={styles.heroCta}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.heroCtaTxt}>{t('Register Now', 'अभी रजिस्टर करें')}</Text>
                    <Feather name="arrow-right" size={16} color="#fff" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </View>
                <RegCountdown />
              </View>
            </View>
          </Pressable>
        </View>

        {/* Photos & Videos quick link */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Pressable
            onPress={() => router.push('/media')}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
            testID="home-media"
          >
            <LinearGradient
              colors={['#1A2950', '#121F3D']}
              style={[styles.mediaLinkCard, { borderColor: 'rgba(255,255,255,0.08)' }]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            >
              <Image 
                source={{ uri: `${SITE_ASSETS}/bcpl-assets/stadium-hero.jpg` }}
                style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} 
                contentFit="cover" 
              />
              <View style={styles.mediaIconWrapper}>
                <LinearGradient
                  colors={['#FF6B00', '#D95A00']}
                  style={StyleSheet.absoluteFill}
                />
                <Feather name="play-circle" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 }}>{t('Photos & Videos', 'फ़ोटो और वीडियो')}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 2, fontFamily: 'Inter_500Medium' }}>{t('Auction, shoots & matchday gallery', 'ऑक्शन, शूट और मैच की गैलरी')}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.82)" />
            </LinearGradient>
          </Pressable>
        </View>

        {/* BCPL so far — league in numbers */}
        <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 4, height: 24, backgroundColor: '#E8B23D', borderRadius: 2, marginRight: 12 }} />
            <View>
              <Text style={{ color: '#E8B23D', fontFamily: 'Inter_700Bold', fontSize: 10.5, letterSpacing: 2 }}>
                {t('BCPL SO FAR', 'अब तक BCPL')}
              </Text>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>
                {t('The league in numbers', 'आँकड़ों में लीग')}
              </Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            {[
              { v: '2,50,000+', l: t('Working professionals joined', 'वर्किंग प्रोफ़ेशनल्स जुड़े'), icon: 'users', color: '#3B82F6' },
              { v: '400+', l: t('Players auctioned', 'खिलाड़ी ऑक्शन हुए'), icon: 'award', color: '#14B8A6' },
              { v: '₹14 Cr+', l: t('Prize money distributed', 'प्राइज़ मनी बाँटी गई'), icon: 'dollar-sign', color: '#31C56B' },
              { v: '4', l: t('Seasons completed', 'सीज़न पूरे हुए'), icon: 'calendar', color: '#A855F7' },
              { v: '50+', l: t('Trial cities', 'ट्रायल शहर'), icon: 'map-pin', color: '#F97316' },
              { v: '10', l: t('Franchises', 'फ्रैंचाइज़ी'), icon: 'shield', color: '#EC4899' },
            ].map((s) => (
              <View key={s.v + s.l} style={styles.statBox}>
                <LinearGradient colors={['rgba(255,255,255,0.03)', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={[styles.statIconBox, { backgroundColor: `${s.color}20` }]}>
                  <Feather name={s.icon as any} size={14} color={s.color} />
                </View>
                <CountUpStat value={s.v} style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 10 }} />
                <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 4, lineHeight: 16 }}>{s.l}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 32 }}>
          {featured.length > 0 ? (
            featured.map((m) => <MatchCard key={m.id} match={m} />)
          ) : matchesQ.isLoading ? (
            <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_500Medium' }}>Loading matches…</Text>
            </Card>
          ) : (
            <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
              <View style={styles.iconCircle}>
                <Feather name="calendar" size={28} color={c.mutedForeground} />
              </View>
              <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 16, marginTop: 16 }}>Schedule</Text>
              <Text style={{ color: c.mutedForeground, marginTop: 6, textAlign: 'center', fontSize: 13, lineHeight: 20 }}>
                {t('Season 5 schedule coming soon — October 2026', 'सीज़न 5 का शेड्यूल जल्द आ रहा है — अक्टूबर 2026')}
              </Text>
            </Card>
          )}
        </View>

        {topTeams.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <View style={styles.sectionRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 4, height: 24, backgroundColor: '#3B82F6', borderRadius: 2, marginRight: 12 }} />
                <View>
                  <Text style={[styles.sectionTitle, { color: c.foreground }]}>Points Table</Text>
                  <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 2 }}>Season 5 Standings</Text>
                </View>
              </View>
              <Pressable onPress={() => router.push('/points')} testID="see-points" style={styles.seeAllBtn}>
                <Text style={{ color: c.accent, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                  {t('Full table', 'पूरी टेबल')}
                </Text>
                <Feather name="chevron-right" size={14} color={c.accent} />
              </Pressable>
            </View>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <View style={[styles.pointsRow, { paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.02)' }]}>
                <Text style={[styles.pos, { color: c.mutedForeground, fontSize: 10.5 }]}>#</Text>
                <View style={{ width: 28 }} />
                <Text style={[styles.teamName, { color: c.mutedForeground, fontSize: 10.5, fontFamily: 'Inter_700Bold', letterSpacing: 1 }]}>TEAM</Text>
                <Text style={{ color: c.mutedForeground, fontSize: 10.5, width: 36, textAlign: 'center', fontFamily: 'Inter_700Bold', letterSpacing: 1 }}>
                  {t('MAT', 'मैच')}
                </Text>
                <Text style={{ color: c.mutedForeground, fontSize: 10.5, width: 44, textAlign: 'center', fontFamily: 'Inter_700Bold', letterSpacing: 1 }}>
                  {t('PTS', 'अंक')}
                </Text>
              </View>
              {topTeams.map((t, i) => (
                <View key={t.team} style={[styles.pointsRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' }, i % 2 === 1 && { backgroundColor: 'rgba(255,255,255,0.015)' }]}>
                  {i < 3 ? (
                    <View style={[styles.medal, { backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32' }]}>
                      <Text style={[styles.medalText, { color: '#000' }]}>{i + 1}</Text>
                    </View>
                  ) : (
                    <Text style={[styles.pos, { color: c.mutedForeground }]}>{i + 1}</Text>
                  )}
                  <TeamLogo name={t.team} size={28} />
                  <Text style={[styles.teamName, { color: c.foreground }]} numberOfLines={1}>
                    {t.team}
                  </Text>
                  <Text style={{ color: c.mutedForeground, fontSize: 12.5, width: 36, textAlign: 'center', fontFamily: 'Inter_500Medium' }}>{t.played}</Text>
                  <View style={[styles.ptsPill, i === 0 && { backgroundColor: 'rgba(232,178,61,0.2)' }]}>
                    <Text style={[styles.pts, { color: i === 0 ? '#E8B23D' : c.foreground }]}>{t.points}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
          <View style={styles.sectionRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 4, height: 24, backgroundColor: '#31C56B', borderRadius: 2, marginRight: 12 }} />
              <View>
                <Text style={[styles.sectionTitle, { color: c.foreground }]}>Latest News</Text>
                <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 2 }}>League Updates</Text>
              </View>
            </View>
            <Pressable onPress={() => router.push('/news')} testID="see-news" style={styles.seeAllBtn}>
              <Text style={{ color: c.accent, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                {t('All news', 'सारी खबरें')}
              </Text>
              <Feather name="chevron-right" size={14} color={c.accent} />
            </Pressable>
          </View>
          {latestNews.map((n) => (
            <Pressable
              key={n.slug}
              onPress={() => router.push(`/news/${n.slug}`)}
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
              testID={`home-news-${n.slug}`}
            >
              <Card style={styles.newsCard}>
                <Image
                  source={{ uri: `${SITE_ASSETS}/bcpl-assets/news/${n.image}` }}
                  style={styles.newsImage}
                  contentFit="cover"
                  transition={150}
                />
                <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']} style={styles.newsImageShade} pointerEvents="none" />
                <View style={styles.newsContent}>
                  <View style={styles.newsTagRow}>
                    <View style={styles.newsTagPill}>
                      <Text style={{ color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
                        {n.tag.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ color: c.mutedForeground, fontSize: 11, fontFamily: 'Inter_500Medium' }}>{n.date}</Text>
                  </View>
                  <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 15, marginTop: 8, lineHeight: 22, letterSpacing: -0.2 }} numberOfLines={2}>
                    {n.title}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cdWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(7,12,26,0.6)',
    borderColor: 'rgba(232,178,61,0.4)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  cdLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 10.5, fontFamily: 'Inter_500Medium' },
  cdTime: { color: '#E8B23D', fontSize: 11.5, fontFamily: 'Inter_700Bold', fontVariant: ['tabular-nums'] },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: {
    flexBasis: '46%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#121F3D',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  mediaIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(232,178,61,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hero: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#070C1A',
    elevation: 8,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  heroKickBadge: {
    backgroundColor: 'rgba(232,178,61,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(232,178,61,0.4)',
  },
  heroKick: {
    color: '#E8B23D',
    fontFamily: 'Inter_700Bold',
    fontSize: 9.5,
    letterSpacing: 2,
  },
  heroFrame: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232,178,61,0.3)',
  },
  heroGanguly: {
    position: 'absolute',
    right: -15,
    bottom: 0,
    width: 200,
    height: '105%',
  },
  heroFee: { color: '#FFFFFF', fontFamily: 'Inter_800ExtraBold', fontSize: 36, lineHeight: 40 },
  heroFeeGst: { color: '#E8B23D', fontSize: 18, fontFamily: 'Inter_700Bold' },
  heroFeeSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4, fontFamily: 'Inter_600SemiBold' },
  heroFeeDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', width: 40, marginVertical: 10 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    shadowColor: '#FF6B00',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroCtaTxt: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 0.3 },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pos: { width: 20, fontFamily: 'Inter_700Bold', fontSize: 14, textAlign: 'center' },
  medal: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: { fontFamily: 'Inter_800ExtraBold', fontSize: 11 },
  teamName: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 14 },
  ptsPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pts: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  newsCard: {
    marginBottom: 16,
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
    alignItems: 'center',
    minHeight: 108,
  },
  newsImage: {
    width: 120,
    height: 108,
  },
  newsImageShade: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 120,
  },
  newsContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  newsTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newsTagPill: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
