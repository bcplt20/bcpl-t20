import React, { useRef, useState, useEffect } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  FlatList,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getMatches, getPointsTable, SITE_ASSETS, getAppBanners, type Match, type AppBanner } from '@/lib/api';
import { NEWS_ARTICLES } from '@/data/news';
import { Card, TeamLogo, GlassAppBar, ScreenBackground, SectionHeader } from '@/components/ui';
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
  const c = useColors();
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
    <View style={[styles.cdWrap, { backgroundColor: c.card2, borderColor: c.line }]}>
      <Feather name="clock" size={12} color={c.getAccentText(c.cyan)} />
      <Text style={[styles.cdLabel, { color: c.sub }]}>{t('Registration closes in', 'रजिस्ट्रेशन बंद होने में')}</Text>
      <Text style={[styles.cdTime, { color: c.getAccentText(c.cyan) }]}>
        {d}d {two(h)}:{two(mi)}:{two(s)}
      </Text>
    </View>
  );
}

const HARDCODED_BANNERS: AppBanner[] = [
  { id: '1', title: '₹299 +GST', subtitle: 'Batsman · Bowler · Wicketkeeper', ctaLabel: 'Register Now', ctaHref: '/register', accent: '#5B2BF0', order: 1 },
  { id: '2', title: '₹1 Crore+', subtitle: 'Prize pool for Season 5', ctaLabel: 'Learn More', ctaHref: '/trust', accent: '#FF1A75', order: 2 },
  { id: '3', title: 'Man of the Series', subtitle: 'Wins a luxury car this season', ctaLabel: 'Rulebook', ctaHref: '/cricket-rulebook', accent: '#00E5FF', order: 3 },
  { id: '4', title: 'From office to stadium', subtitle: 'League stats & numbers', ctaLabel: 'About Us', ctaHref: '/trust', accent: '#FF8A3D', order: 4 },
];

function BannerCarousel({ banners }: { banners: AppBanner[] }) {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const width = Dimensions.get('window').width - 32;
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [banners.length]);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % banners.length;
        scrollRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4500);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const newIdx = Math.round(x / width);
    if (newIdx !== index && newIdx >= 0 && newIdx < banners.length) {
      setIndex(newIdx);
    }
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <FlatList
        ref={scrollRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onTouchStart={stopTimer}
        onTouchEnd={startTimer}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => item.ctaHref && router.push(item.ctaHref as any)} style={{ width }}>
            <Card padding={0} style={{ overflow: 'hidden', height: 200, marginRight: 0 }}>
              <LinearGradient colors={[c.card2, c.card]} style={StyleSheet.absoluteFill} />
              
              {/* Diagonal stroke accents */}
              <LinearGradient 
                colors={[`${item.accent}40`, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 300, transform: [{ rotate: '45deg' }] }}
              />
              <LinearGradient 
                colors={[`${item.accent}20`, 'transparent']}
                start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }}
                style={{ position: 'absolute', bottom: -50, left: -50, width: 150, height: 300, transform: [{ rotate: '45deg' }] }}
              />
              
              <View style={{ padding: 24, flex: 1, justifyContent: 'center' }}>
                {item.id === '1' && (
                  <View style={[styles.heroKickBadge, { backgroundColor: c.card2, borderColor: c.line }]}>
                    <Text style={[styles.heroKick, { color: c.getAccentText(c.cyan) }]}>SEASON 5 · {t('REGISTRATIONS OPEN', 'रजिस्ट्रेशन शुरू')}</Text>
                  </View>
                )}
                
                <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 32, lineHeight: 36 }}>
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text style={{ color: c.sub, fontSize: 13, marginTop: 8, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    {item.subtitle}
                  </Text>
                ) : null}

                {item.id === '1' ? (
                  <View style={{ marginTop: 'auto' }}>
                    <RegCountdown />
                  </View>
                ) : null}
              </View>
            </Card>
          </Pressable>
        )}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 }}>
        {banners.map((_, i) => (
          <View key={i} style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? c.magenta : c.line }} />
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const c = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLang();

  const bannersQ = useQuery({ queryKey: ['app-banners'], queryFn: getAppBanners, staleTime: 5 * 60 * 1000 });

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
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar />
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : 100, paddingTop: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={matchesQ.isRefetching}
            onRefresh={() => {
              matchesQ.refetch();
              pointsQ.refetch();
            }}
            tintColor={c.magenta}
          />
        }
      >

        <BannerCarousel banners={bannersQ.data?.banners?.length ? bannersQ.data.banners : HARDCODED_BANNERS} />


        {/* BCPL so far — league in numbers */}
        <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
          <SectionHeader title={t('The league in numbers', 'आँकड़ों में लीग')} />
          <View style={styles.statsGrid}>
            {[
              { v: '2,50,000+', l: t('Working professionals joined', 'वर्किंग प्रोफ़ेशनल्स जुड़े'), icon: 'users', color: c.violet },
              { v: '400+', l: t('Players auctioned', 'खिलाड़ी ऑक्शन हुए'), icon: 'award', color: c.mint },
              { v: '₹14 Cr+', l: t('Prize money distributed', 'प्राइज़ मनी बाँटी गई'), icon: 'dollar-sign', color: c.lime },
              { v: '4', l: t('Seasons completed', 'सीज़न पूरे हुए'), icon: 'calendar', color: c.magenta },
              { v: '50+', l: t('Trial cities', 'ट्रायल शहर'), icon: 'map-pin', color: c.orange },
              { v: '10', l: t('Franchises', 'फ्रैंचाइज़ी'), icon: 'shield', color: c.cyan },
            ].map((s) => (
              <View key={s.v + s.l} style={[styles.statBox, { backgroundColor: c.card, borderColor: c.line, shadowColor: c.isDark ? '#000' : '#2D196E', shadowOpacity: c.isDark ? 0.34 : 0.09 }]}>
                <View style={[styles.statIconBox, { backgroundColor: `${s.color}20` }]}>
                  <Feather name={s.icon as any} size={14} color={c.getAccentText(s.color)} />
                </View>
                <CountUpStat value={s.v} style={{ color: c.ink, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20, marginTop: 10 }} />
                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, marginTop: 4, lineHeight: 16 }}>{s.l}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 32 }}>
          <SectionHeader title={t('Match Center', 'मैच सेंटर')} onSeeAll={() => router.push('/matches')} seeAllLabel={t('See all', 'सभी देखें')} seeAllTestID="see-matches" />
          {featured.length > 0 ? (
            featured.map((m) => <MatchCard key={m.id} match={m} />)
          ) : matchesQ.isLoading ? (
            <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium' }}>Loading matches…</Text>
            </Card>
          ) : (
            <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
              <View style={styles.iconCircle}>
                <Feather name="calendar" size={28} color={c.sub} />
              </View>
              <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, marginTop: 16 }}>Schedule</Text>
              <Text style={{ color: c.sub, marginTop: 6, textAlign: 'center', fontSize: 13, lineHeight: 20 }}>
                {t('Season 5 schedule coming soon — October 2026', 'सीज़न 5 का शेड्यूल जल्द आ रहा है — अक्टूबर 2026')}
              </Text>
            </Card>
          )}
        </View>

        {topTeams.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
            <SectionHeader title={t('Points Table', 'अंक तालिका')} onSeeAll={() => router.push('/points')} seeAllLabel={t('See all', 'सभी देखें')} seeAllTestID="see-points" />
            <Card padding={0} border={true}>
              <View style={[styles.pointsRow, { paddingVertical: 10, backgroundColor: c.card2, borderBottomWidth: 1, borderBottomColor: c.line }]}>
                <Text style={[styles.pos, { color: c.sub, fontSize: 10.5 }]}>#</Text>
                <View style={{ width: 28 }} />
                <Text style={[styles.teamName, { color: c.sub, fontSize: 10.5, letterSpacing: 1 }]}>TEAM</Text>
                <Text style={{ color: c.sub, fontSize: 10.5, width: 36, textAlign: 'center', fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 1 }}>
                  {t('MAT', 'मैच')}
                </Text>
                <Text style={{ color: c.sub, fontSize: 10.5, width: 44, textAlign: 'center', fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 1 }}>
                  {t('PTS', 'अंक')}
                </Text>
              </View>
              {topTeams.map((t, i) => (
                <View key={t.team} style={[styles.pointsRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}>
                  {i < 3 ? (
                    <View style={[styles.medal, { backgroundColor: i === 0 ? '#FFC53D' : i === 1 ? '#9E9BD1' : '#FF8A3D' }]}>
                      <Text style={[styles.medalText, { color: c.card }]}>{i + 1}</Text>
                    </View>
                  ) : (
                    <Text style={[styles.pos, { color: c.sub }]}>{i + 1}</Text>
                  )}
                  <TeamLogo name={t.team} size={28} />
                  <Text style={[styles.teamName, { color: c.ink }]} numberOfLines={1}>
                    {t.team}
                  </Text>
                  <Text style={{ color: c.sub, fontSize: 12.5, width: 36, textAlign: 'center', fontFamily: 'PlusJakartaSans_500Medium' }}>{t.played}</Text>
                  <View style={[styles.ptsPill, i === 0 && { backgroundColor: `${c.amber}22` }]}>
                    <Text style={[styles.pts, { color: i === 0 ? c.getAccentText(c.amber) : c.ink }]}>{t.points}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
          <SectionHeader title={t('Latest News', 'ताज़ा खबरें')} onSeeAll={() => router.push('/news')} seeAllLabel={t('See all', 'सभी देखें')} seeAllTestID="see-news" />
          {latestNews.map((n) => (
            <Pressable
              key={n.slug}
              onPress={() => router.push(`/news/${n.slug}`)}
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
              testID={`home-news-${n.slug}`}
            >
              <Card padding={0} style={styles.newsCard}>
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
                      <Text style={{ color: '#fff', fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.5 }}>
                        {n.tag.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ color: c.sub, fontSize: 11, fontFamily: 'PlusJakartaSans_500Medium' }}>{n.date}</Text>
                  </View>
                  <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, marginTop: 8, lineHeight: 22, letterSpacing: -0.2 }} numberOfLines={2}>
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
    backgroundColor: 'rgba(11, 8, 19,0.6)',
    borderColor: 'rgba(0, 229, 255,0.4)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  cdLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 10.5, fontFamily: 'PlusJakartaSans_500Medium' },
  cdTime: { color: '#00E5FF', fontSize: 11.5, fontFamily: 'PlusJakartaSans_700Bold', fontVariant: ['tabular-nums'] },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: {
    flexBasis: '46%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#161124',
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
  sectionTitle: { fontSize: 20, fontFamily: 'BricolageGrotesque_800ExtraBold', letterSpacing: -0.5 },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 229, 255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hero: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0B0813',
    elevation: 8,
    shadowColor: '#FF1A75',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  heroKickBadge: {
    backgroundColor: 'rgba(0, 229, 255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255,0.4)',
  },
  heroKick: {
    color: '#00E5FF',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9.5,
    letterSpacing: 2,
  },
  heroFrame: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255,0.3)',
  },
  heroGanguly: {
    position: 'absolute',
    right: -15,
    bottom: 0,
    width: 200,
    height: '105%',
  },
  heroFee: { color: '#FFFFFF', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 36, lineHeight: 40 },
  heroFeeGst: { color: '#00E5FF', fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold' },
  heroFeeSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4, fontFamily: 'PlusJakartaSans_600SemiBold' },
  heroFeeDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', width: 40, marginVertical: 10 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    shadowColor: '#FF1A75',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroCtaTxt: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, letterSpacing: 0.3 },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pos: { width: 20, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, textAlign: 'center' },
  medal: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 11 },
  teamName: { flex: 1, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  ptsPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pts: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
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
    backgroundColor: '#FF1A75',
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
