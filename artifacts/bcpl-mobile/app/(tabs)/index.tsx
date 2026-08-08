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
import { REG_CLOSE_AT } from '@/lib/season';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getDashboard, getMatches, getPointsTable, getTeams, SITE_ASSETS, getAppBanners, getAppMedia, type Match, type AppBanner, type Team, getSponsors, getTeamGroup, type AppMediaItem, getNotifications, getLiveMatches } from '@/lib/api';
import * as WebBrowser from 'expo-web-browser';
import { NEWS_ARTICLES } from '@/data/news';
import { Card, TeamLogo, GlassAppBar, ScreenBackground, SectionHeader, useAppBarHeight, useBottomNavHeight } from '@/components/ui';
import { ProfileBackfillCard } from '@/components/ProfileBackfillCard';
import { teamLogoUri } from '@/app/teams';
import { MatchCard } from '@/components/MatchCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Feather, Ionicons } from '@expo/vector-icons';
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

const RegCountdown = React.memo(() => {
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
      <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11 }} numberOfLines={1}>
        <Text style={{ color: c.sub, fontSize: 10, textTransform: 'uppercase' }}>{t('REG CLOSES IN', 'रजिस्ट्रेशन बंद होने में')} · </Text>
        <Text style={{ color: c.getAccentText(c.cyan), fontVariant: ['tabular-nums'] }}>{d}d {two(h)}:{two(mi)}:{two(s)}</Text>
      </Text>
    </View>
  );
});

const HARDCODED_BANNERS: AppBanner[] = [
  { id: '1', title: '₹299 +GST', subtitle: 'Batsman · Bowler · Wicketkeeper', ctaLabel: 'Register Now', ctaHref: '/register', accent: '#5B2BF0', order: 1 },
  { id: '2', title: '₹1 Crore+', subtitle: 'Prize pool for Season 5', ctaLabel: 'Learn More', ctaHref: '/trust', accent: '#FF1A75', order: 2 },
  { id: '3', title: 'Man of the Series', subtitle: 'Wins a luxury car this season', ctaLabel: 'Rulebook', ctaHref: '/cricket-rulebook', accent: '#00E5FF', order: 3 },
  { id: '4', title: 'From office to stadium', subtitle: 'League stats & numbers', ctaLabel: 'About Us', ctaHref: '/trust', accent: '#FF8A3D', order: 4 },
];


const ACCENT_HEX: Record<string, string> = {
  violet: '#7C5CFF', magenta: '#FF3DA6', cyan: '#00DCF5', lime: '#B6FF3C', amber: '#FFC53D',
};
function accentHex(a?: string): string {
  if (!a) return '#7C5CFF';
  return a.startsWith('#') ? a : ACCENT_HEX[a] || '#7C5CFF';
}

/** Dream11-style vibrant gradient set per banner accent. */
function bannerGradient(a?: string): [string, string, string] {
  const hex = accentHex(a).toUpperCase();
  switch (hex) {
    case '#5B2BF0': return ['#4316D8', '#8A2BE8', '#E03398'];   // violet → magenta
    case '#FF1A75': return ['#C4126B', '#FF1A75', '#FF7A3D'];   // magenta → orange
    case '#00E5FF': return ['#0047C8', '#0090F0', '#00DCF5'];   // deep blue → cyan
    case '#FF8A3D': return ['#E04E12', '#FF8A3D', '#FFC53D'];   // orange → amber
    default: return ['#4316D8', '#8A2BE8', '#E03398'];
  }
}

export const BannerCarousel = React.memo(({ banners }: { banners: AppBanner[] }) => {
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
        getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item }) => {
          const hasImage = !!item.imageUrl;
          return (
          <Pressable onPress={() => item.ctaHref && router.push(item.ctaHref as any)} style={{ width }}>
            <Card padding={0} style={{ overflow: 'hidden', height: 200, marginRight: 0 }}>
              {hasImage ? (
                <>
                  {/* Real banner image fills the card; dark scrim keeps text legible */}
                  <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={200} />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.8)']}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </>
              ) : (
                <>
                  {/* Vibrant Dream11-style gradient background */}
                  <LinearGradient
                    colors={bannerGradient(item.accent)}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Glow blobs for depth */}
                  <View style={{ position: 'absolute', top: -70, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.14)' }} />
                  <View style={{ position: 'absolute', bottom: -90, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(0,0,0,0.18)' }} />
                  {/* Diagonal energy strokes */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0.35)', 'transparent']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: -40, right: 30, width: 26, height: 320, transform: [{ rotate: '38deg' }], borderRadius: 13 }}
                  />
                  <LinearGradient
                    colors={['rgba(255,255,255,0.18)', 'transparent']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: -20, right: 76, width: 12, height: 300, transform: [{ rotate: '38deg' }], borderRadius: 6 }}
                  />
                  {/* Ball watermark */}
                  <Image
                    source={require('../../assets/images/bcpl-ball-clean.png')}
                    style={{ position: 'absolute', right: -34, bottom: -34, width: 150, height: 150, opacity: 0.28 }}
                    contentFit="contain" cachePolicy="memory-disk"
                  />
                </>
              )}

              <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
                {item.ctaHref === '/register' && !hasImage && (
                  <View style={[styles.heroKickBadge, { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.35)' }]}>
                    <Text style={[styles.heroKick, { color: '#FFFFFF' }]}>SEASON 5 · {t('REGISTRATIONS OPEN', 'रजिस्ट्रेशन शुरू')}</Text>
                  </View>
                )}
                {item.ctaHref === '/register' && hasImage && (
                  <View style={[styles.heroKickBadge, { backgroundColor: c.card2, borderColor: c.line }]}>
                    <Text style={[styles.heroKick, { color: c.getAccentText(c.cyan) }]}>SEASON 5 · {t('REGISTRATIONS OPEN', 'रजिस्ट्रेशन शुरू')}</Text>
                  </View>
                )}

                <Text style={{ color: '#FFFFFF', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 32, lineHeight: 36, textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13, marginTop: 6, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                    {item.subtitle}
                  </Text>
                ) : null}

                <View style={{ marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  {item.ctaHref === '/register' ? <RegCountdown /> : <View />}
                  {item.ctaLabel ? (
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 }}>
                      <Text style={{ color: bannerGradient(item.accent)[0], fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 13 }}>
                        {item.ctaHref === '/register' ? t('Register Now', 'रजिस्टर करें') : item.ctaLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Card>
          </Pressable>
          );
        }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 }}>
        {banners.map((_, i) => (
          <View key={i} style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? c.magenta : c.line }} />
        ))}
      </View>
    </View>
  );
});

const TEAMS_CANON_ORDER = [
  'Rajasthan Scorchers', 'Mumbai Mavericks', 'Chennai Thalaivas', 'Hyderabad Hawks', 'Ahmedabad Lions',
  'Delhi Suryas', 'Punjab Warriors', 'Kolkata Tigers', 'Lucknow Nawabs', 'Bengaluru Rockets',
];

function HomeMediaSection({ media }: { media: AppMediaItem[] }) {
  const c = useColors();
  const { t } = useLang();
  const router = useRouter();

  if (!media || media.length === 0) return null;

  const photos = media.filter(m => m.kind === 'photo').slice(0, 6);
  const videos = media.filter(m => m.kind === 'video' || m.kind === 'short').slice(0, 4);

  return (
    <View style={{ marginTop: 32 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <SectionHeader title={t('Media', 'मीडिया')} onSeeAll={() => router.navigate('/media')} seeAllLabel={t('See all', 'सभी देखें')} />
      </View>
      
      {photos.length > 0 && (
        <FlatList
          data={photos}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 16 }}
          keyExtractor={(item) => item.id}
          getItemLayout={(data, index) => ({ length: 152, offset: 152 * index, index })} // 140 + 12 gap
          renderItem={({ item: p }) => (
            <Pressable onPress={() => router.navigate('/media')} style={({pressed}) => ({ opacity: pressed ? 0.9 : 1 })}>
              <Image source={{ uri: p.thumbUrl || p.url }} style={{ width: 140, height: 140, borderRadius: 16, backgroundColor: c.card2, borderWidth: 1, borderColor: c.line }} contentFit="cover" cachePolicy="memory-disk" transition={150} />
            </Pressable>
          )}
        />
      )}

      {videos.length > 0 && (
        <FlatList
          data={videos}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          keyExtractor={(item) => item.id}
          getItemLayout={(data, index) => ({ length: 232, offset: 232 * index, index })} // 220 + 12 gap
          renderItem={({ item: v }) => (
            <Pressable onPress={() => router.navigate('/media')} style={({pressed}) => ({ opacity: pressed ? 0.9 : 1, width: 220 })}>
              <View style={{ width: '100%', aspectRatio: 16/9, borderRadius: 16, overflow: 'hidden', backgroundColor: c.card2, borderWidth: 1, borderColor: c.line }}>
                <Image source={{ uri: v.thumbUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' }}>
                    <Feather name="play" size={20} color="#000" style={{ marginLeft: 2 }} />
                  </View>
                </View>
              </View>
              {v.title ? (
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, marginTop: 8 }} numberOfLines={2}>{v.title}</Text>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function TeamsStrip() {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const q = useQuery({ queryKey: ['teams'], queryFn: getTeams, staleTime: 5 * 60 * 1000 });

  const teams = React.useMemo(() => {
    const list = [...(q.data?.teams ?? [])];
    list.sort((a, b) => {
      const ia = TEAMS_CANON_ORDER.indexOf(a.name);
      const ib = TEAMS_CANON_ORDER.indexOf(b.name);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.name.localeCompare(b.name);
    });
    return list;
  }, [q.data]);

  if (q.isLoading || teams.length === 0) return null;

  return (
    <View style={{ marginTop: 32 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <SectionHeader title={t('Teams', 'टीमें')} onSeeAll={() => router.push('/teams')} seeAllLabel={t('See all', 'सभी देखें')} seeAllTestID="see-teams" />
      </View>
      <FlatList
        data={teams}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        keyExtractor={(item) => item.id}
        getItemLayout={(data, index) => ({ length: 140, offset: 140 * index, index })} // 128 + 12 gap
        renderItem={({ item: team }) => {
          const accent = team.color || c.violet;
          const second = team.secondColor || accent;
          const logo = teamLogoUri(team.logoUrl);
          return (
            <Pressable
              onPress={() => router.push(`/team/${team.slug}`)}
              testID={`home-team-${team.slug}`}
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
            >
              <View style={{ width: 128, height: 168, borderRadius: 18, borderWidth: 1, borderColor: c.line, backgroundColor: c.card, overflow: 'hidden', padding: 14, alignItems: 'center' }}>
                <LinearGradient
                  colors={[`${accent}1A`, `${second}05`, 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center' }}>
                  {logo ? (
                    <Image source={{ uri: logo }} style={{ width: '100%', height: '100%' }} contentFit="contain" cachePolicy="memory-disk" />
                  ) : (
                    <View style={{ width: '100%', height: '100%', borderRadius: 44, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 32 }}>
                        {team.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('')}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1, justifyContent: 'center', marginTop: 4 }}>
                  <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' }} numberOfLines={1}>
                    {team.name.split(' ')[0]}
                  </Text>
                  <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15, textAlign: 'center', marginTop: 2 }} numberOfLines={1}>
                    {team.name.split(' ').slice(1).join(' ')}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

/**
 * Resume banner for a logged-in player whose Phase 1 registration is incomplete
 * because the entry fee is still unpaid. Tapping "जारी रहें" jumps into the
 * register screen, which resumes directly on the Confirm & Pay step (see
 * register.tsx syncStatus).
 *
 * COMPLIANCE: legacy carryover players (dashboard `carryover` flag / phase1Status
 * 'selected' waived) MUST NEVER see a payment prompt — they are hard-excluded.
 */
function ResumeRegistrationBanner() {
  const c = useColors();
  const router = useRouter();
  const { t } = useLang();
  const { token } = useAuth();

  const q = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => getDashboard(token as string),
    enabled: !!token,
  });

  const reg = q.data?.registration;
  // Carryover / waived players are excluded outright — never a payment prompt.
  if (!reg || reg.carryover === true || reg.phase1Status === 'selected') return null;
  // Show only when Phase 1 is registered-but-unpaid: payment record pending, or
  // no payment record yet while the registration status is still 'pending'.
  const paymentPending = q.data?.phase1Payment?.status === 'pending';
  const noPaymentYet = !q.data?.phase1Payment && reg.phase1Status === 'pending';
  if (!paymentPending && !noPaymentYet) return null;

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
      <Pressable
        onPress={() => router.push('/register')}
        testID="home-resume-registration"
        style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1, borderRadius: 18 })}
      >
        <Card padding={0} style={{ overflow: 'hidden', borderColor: 'rgba(255,61,166,0.45)', borderWidth: 1 }}>
          <LinearGradient
            colors={['rgba(124,92,255,0.16)', 'rgba(255,61,166,0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
            <LinearGradient
              colors={['#7C5CFF', '#FF3DA6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name="clock" size={20} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.getAccentText(c.cyan), fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 1.4, marginBottom: 4 }}>
                {t('REGISTRATION INCOMPLETE', 'रजिस्ट्रेशन अधूरा')}
              </Text>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, lineHeight: 21 }}>
                {t('Your registration is incomplete — payment is pending', 'आपका registration अधूरा है — payment बाकी है')}
              </Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={{ borderRadius: 14, overflow: 'hidden' }}>
              <LinearGradient colors={['#7C5CFF', '#FF3DA6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 }}>
                <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15, letterSpacing: 0.3 }}>
                  {t('Continue', 'जारी रखें')}
                </Text>
                <Feather name="arrow-right" size={17} color="#fff" />
              </View>
            </View>
          </View>
        </Card>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const c = useColors();
  const router = useRouter();
  const { user, token } = useAuth();
  const { t } = useLang();
  
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const bannersQ = useQuery({ queryKey: ['app-banners'], queryFn: getAppBanners, staleTime: 5 * 60 * 1000 });

  const matchesQ = useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
    staleTime: 60000,
    refetchInterval: 60000,
  });
  const pointsQ = useQuery({ queryKey: ['points'], queryFn: getPointsTable, staleTime: 60000 });
  const sponsorsQ = useQuery({ queryKey: ['sponsors'], queryFn: getSponsors, staleTime: 5 * 60 * 1000 });
  const mediaQ = useQuery({ queryKey: ['app-media'], queryFn: getAppMedia, staleTime: 5 * 60 * 1000 });

  const liveMatchesQ = useQuery({ queryKey: ['live-matches'], queryFn: () => getLiveMatches().catch(() => null), refetchInterval: 10000 });
  const liveMatch = liveMatchesQ.data?.matches?.find((m: any) => m.isLive);

  const matches = matchesQ.data?.matches ?? [];
  const featured = pickFeatured(matches);
  
  const allPoints = pointsQ.data?.table ?? [];
  const groupA = allPoints.filter(t => getTeamGroup(t.team) === 'A');
  const groupB = allPoints.filter(t => getTeamGroup(t.team) === 'B');
  
  // If grouped, pick top 2 of each; otherwise top 3 overall
  const isGrouped = groupA.length > 0 || groupB.length > 0;
  const topTeams = isGrouped ? [] : allPoints.slice(0, 3);
  
  const latestNews = NEWS_ARTICLES.slice(0, 2);
  const anyLive = matches.some((m) => m.status === 'live');

  // Group sponsors by category string as-is
  const sponsorGroups = React.useMemo(() => {
    if (!sponsorsQ.data?.sponsors) return [];
    
    const groups: { label: string; items: typeof sponsorsQ.data.sponsors }[] = [];
    
    sponsorsQ.data.sponsors.forEach(s => {
      // The API now returns `category` string as requested
      // We fall back to tier if category isn't passed but it should be.
      const label = (s as any).category || s.tier || 'Partners';
      let group = groups.find(g => g.label.toLowerCase() === label.toLowerCase());
      if (!group) {
        group = { label, items: [] };
        groups.push(group);
      }
      group.items.push(s);
    });

    return groups;
  }, [sponsorsQ.data?.sponsors]);

  const notifsQ = useQuery({ queryKey: ['notifications'], queryFn: () => getNotifications().catch(() => null), staleTime: 60 * 1000 });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar
        right={
          token ? (
            <Pressable onPress={() => router.push('/notifications' as any)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, width: 40, height: 40, borderRadius: 20, backgroundColor: c.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.line })}>
              <Feather name="bell" size={18} color={c.ink} />
              {(notifsQ.data?.unreadCount || 0) > 0 && (
                <View style={{ position: 'absolute', top: 8, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: c.magenta, borderWidth: 1, borderColor: c.card2 }} />
              )}
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustsScrollIndicatorInsets={false}
        contentContainerStyle={{ paddingBottom: bottomNavHeight }}
        refreshControl={
          <RefreshControl
            refreshing={matchesQ.isRefetching}
            onRefresh={() => {
              matchesQ.refetch();
              pointsQ.refetch();
              bannersQ.refetch();
            }}
            tintColor={c.magenta}
            progressViewOffset={appBarHeight}
          />
        }
      >
        <View style={{ height: appBarHeight + 16 }} />
        <ProfileBackfillCard />

        {React.useMemo(() => liveMatch ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Pressable onPress={() => router.push(`/match/${liveMatch.matchId}`)} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
              <Card padding={16} style={{ overflow: 'hidden', borderWidth: 1, borderColor: '#FF3DA6' }}>
                <LinearGradient colors={['rgba(255,61,166,0.15)', 'rgba(255,61,166,0.02)', 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3DA6' }} />
                    <Text style={{ color: '#FF3DA6', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                      {t('LIVE NOW', 'अभी लाइव')}
                    </Text>
                  </View>
                  <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 }}>Match {liveMatch.matchNo}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }} numberOfLines={1}>{liveMatch.team1}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 16 }}>
                    <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 }}>VS</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }} numberOfLines={1}>{liveMatch.team2}</Text>
                  </View>
                </View>
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.line, alignItems: 'center' }}>
                  <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }}>
                    {t('Tap to follow live score & moments', 'लाइव स्कोर और मोमेंट्स देखने के लिए टैप करें')}
                  </Text>
                </View>
              </Card>
            </Pressable>
          </View>
        ) : null, [liveMatch, c, t])}

        <BannerCarousel banners={bannersQ.data?.banners?.length ? bannersQ.data.banners : HARDCODED_BANNERS} />

        {token ? <ResumeRegistrationBanner /> : null}

        {token ? (
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <Pressable
              onPress={() => router.push('/journey')}
              testID="home-my-journey"
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, borderRadius: 18, overflow: 'hidden' })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, overflow: 'hidden' }}>
                <LinearGradient colors={['#5B2BF0', '#9B2FF0', '#FF3DA6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="map" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>{t('My Journey', 'मेरा सफ़र')}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12.5, marginTop: 2 }}>
                    {t('Track your season status & next steps', 'अपनी सीज़न स्थिति और अगले कदम देखें')}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.9)" />
              </View>
            </Pressable>
          </View>
        ) : null}

        {/* Action pairs: Fan Voting & MVP */}
        <View style={{ paddingHorizontal: 16, marginTop: 24, flexDirection: 'row', gap: 12 }}>
          <Pressable 
            onPress={() => router.push('/vote')} 
            style={({ pressed }) => ({ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.line, opacity: pressed ? 0.9 : 1 })}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,220,245,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Feather name="bar-chart-2" size={16} color="#00DCF5" />
            </View>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, marginBottom: 2 }}>{t('Fan Voting', 'फैन वोटिंग')}</Text>
            <Text style={{ color: c.getAccentText(c.cyan), fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 }}>{t('Starts soon', 'जल्द शुरू होगा')}</Text>
          </Pressable>
          <Pressable 
            onPress={() => router.push('/mvp')} 
            style={({ pressed }) => ({ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.line, opacity: pressed ? 0.9 : 1 })}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,197,61,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Feather name="star" size={16} color={c.getAccentText(c.amber)} />
            </View>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, marginBottom: 2 }}>{t('MVP Race', 'MVP रेस')}</Text>
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 }}>{t('Car leaderboard', 'कार लीडरबोर्ड')}</Text>
          </Pressable>
        </View>

        {/* BCPL so far — league in numbers */}
        {React.useMemo(() => (
          <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
            <SectionHeader title={t('The league in numbers', 'आँकड़ों में लीग')} />
            <View style={styles.statsGrid}>
              {[
                { v: '2,50,000+', l: t('Working professionals joined', 'वर्किंग प्रोफ़ेशनल्स जुड़े'), icon: 'users', color: ['#5B2BF0', '#9B2FF0'] },
                { v: '400+', l: t('Players auctioned', 'खिलाड़ी ऑक्शन हुए'), icon: 'award', color: ['#16E0A3', '#00B8D9'] },
                { v: '₹14 Cr+', l: t('Prize money distributed', 'प्राइज़ मनी बाँटी गई'), icon: 'dollar-sign', color: ['#B6FF3C', '#16E0A3'] },
                { v: '4', l: t('Seasons completed', 'सीज़न पूरे हुए'), icon: 'calendar', color: ['#FF3DA6', '#FF1A75'] },
                { v: '50+', l: t('Trial cities', 'ट्रायल शहर'), icon: 'map-pin', color: ['#FFC53D', '#FF8A3D'] },
                { v: '10', l: t('Franchises', 'फ्रैंचाइज़ी'), icon: 'shield', color: ['#00E5FF', '#00B3FF'] },
              ].map((s) => (
                <View key={s.v + s.l} style={[styles.statBox, { backgroundColor: c.card2, borderColor: s.color[0], borderWidth: 1, shadowColor: s.color[0], shadowOpacity: c.isDark ? 0.34 : 0.09, shadowRadius: 10, elevation: 4 }]}>
                  <LinearGradient colors={s.color as [string, string]} style={[StyleSheet.absoluteFill, { opacity: c.isDark ? 0.08 : 0.04, borderRadius: 19 }]} />
                  <LinearGradient colors={s.color as [string, string]} style={styles.statIconBox}>
                    <Feather name={s.icon as any} size={16} color="#fff" />
                  </LinearGradient>
                  <CountUpStat value={s.v} style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, marginTop: 12 }} />
                  <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, marginTop: 4, lineHeight: 18 }}>{s.l}</Text>
                </View>
              ))}
            </View>
          </View>
        ), [c, t])}

        {token && React.useMemo(() => (
          <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
            <Pressable onPress={() => router.push('/refer' as any)} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
              <Card padding={24} style={{ overflow: 'hidden', borderWidth: 1, borderColor: `${c.violet}30` }}>
                <LinearGradient colors={[`${c.violet}1A`, `${c.magenta}05`, 'transparent']} style={StyleSheet.absoluteFill} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.magenta, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="gift" size={24} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginBottom: 4 }}>
                      {t('Refer & Earn', 'रेफर करें और कमाएं')}
                    </Text>
                    <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 18 }}>
                      {t('Invite 3 friends to win exclusive BCPL training gear.', '3 दोस्तों को आमंत्रित करें और खास BCPL किट जीतें।')}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={c.sub} />
                </View>
              </Card>
            </Pressable>
          </View>
        ), [c, t, token])}

        {React.useMemo(() => (
          <View style={{ paddingHorizontal: 16, paddingTop: 32 }}>
            <SectionHeader title={t('Match Center', 'मैच सेंटर')} onSeeAll={() => router.navigate('/matches')} seeAllLabel={t('See all', 'सभी देखें')} seeAllTestID="see-matches" />
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
        ), [featured, matchesQ.isLoading, c, t])}

        {React.useMemo(() => (
          (isGrouped || topTeams.length > 0) ? (
            <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
              <SectionHeader title={t('Points Table', 'अंक तालिका')} onSeeAll={() => router.navigate('/points')} seeAllLabel={t('See all', 'सभी देखें')} seeAllTestID="see-points" />
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

                {isGrouped ? (
                  <>
                    <View style={{ backgroundColor: `${c.cyan}10`, paddingVertical: 6, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.line }}>
                      <Text style={{ color: c.getAccentText(c.cyan), fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 11, letterSpacing: 1 }}>GROUP A</Text>
                    </View>
                    {groupA.slice(0, 2).map((t, i) => (
                      <View key={t.team} style={[styles.pointsRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}>
                        <View style={[styles.medal, { backgroundColor: i === 0 ? '#FFC53D' : '#9E9BD1' }]}>
                          <Text style={[styles.medalText, { color: c.card }]}>{i + 1}</Text>
                        </View>
                        <TeamLogo name={t.team} size={36} />
                        <Text style={[styles.teamName, { color: c.ink }]} numberOfLines={1}>{t.team}</Text>
                        <Text style={{ color: c.sub, fontSize: 12.5, width: 36, textAlign: 'center', fontFamily: 'PlusJakartaSans_500Medium' }}>{t.played}</Text>
                        <View style={[styles.ptsPill, i === 0 && { backgroundColor: `${c.amber}22` }]}>
                          <Text style={[styles.pts, { color: i === 0 ? c.getAccentText(c.amber) : c.ink }]}>{t.points}</Text>
                        </View>
                      </View>
                    ))}
                    
                    <View style={{ backgroundColor: `${c.cyan}10`, paddingVertical: 6, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.line, borderTopWidth: 1, borderTopColor: c.line }}>
                      <Text style={{ color: c.getAccentText(c.cyan), fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 11, letterSpacing: 1 }}>GROUP B</Text>
                    </View>
                    {groupB.slice(0, 2).map((t, i) => (
                      <View key={t.team} style={[styles.pointsRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}>
                        <View style={[styles.medal, { backgroundColor: i === 0 ? '#FFC53D' : '#9E9BD1' }]}>
                          <Text style={[styles.medalText, { color: c.card }]}>{i + 1}</Text>
                        </View>
                        <TeamLogo name={t.team} size={36} />
                        <Text style={[styles.teamName, { color: c.ink }]} numberOfLines={1}>{t.team}</Text>
                        <Text style={{ color: c.sub, fontSize: 12.5, width: 36, textAlign: 'center', fontFamily: 'PlusJakartaSans_500Medium' }}>{t.played}</Text>
                        <View style={[styles.ptsPill, i === 0 && { backgroundColor: `${c.amber}22` }]}>
                        <Text style={[styles.pts, { color: i === 0 ? c.getAccentText(c.amber) : c.ink }]}>{t.points}</Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                topTeams.map((t, i) => (
                  <View key={t.team} style={[styles.pointsRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}>
                    {i < 3 ? (
                      <View style={[styles.medal, { backgroundColor: i === 0 ? '#FFC53D' : i === 1 ? '#9E9BD1' : '#FF8A3D' }]}>
                        <Text style={[styles.medalText, { color: c.card }]}>{i + 1}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.pos, { color: c.sub }]}>{i + 1}</Text>
                    )}
                    <TeamLogo name={t.team} size={36} />
                    <Text style={[styles.teamName, { color: c.ink }]} numberOfLines={1}>
                      {t.team}
                    </Text>
                    <Text style={{ color: c.sub, fontSize: 12.5, width: 36, textAlign: 'center', fontFamily: 'PlusJakartaSans_500Medium' }}>{t.played}</Text>
                    <View style={[styles.ptsPill, i === 0 && { backgroundColor: `${c.amber}22` }]}>
                      <Text style={[styles.pts, { color: i === 0 ? c.getAccentText(c.amber) : c.ink }]}>{t.points}</Text>
                    </View>
                  </View>
                ))
              )}
            </Card>
          </View>
        ) : null
        ), [isGrouped, groupA, groupB, topTeams, c, t])}

        <TeamsStrip />
        
        <HomeMediaSection media={mediaQ.data?.items ?? []} />

        {React.useMemo(() => (
          <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
            <SectionHeader title={t('Latest News', 'ताज़ा खबरें')} onSeeAll={() => router.navigate('/news')} seeAllLabel={t('See all', 'सभी देखें')} seeAllTestID="see-news" />
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
                    contentFit="cover" cachePolicy="memory-disk"
                    transition={150}
                  />
                  <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']} style={styles.newsImageShade}  />
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
        ), [latestNews, c, t])}

        {React.useMemo(() => (
          sponsorGroups.length > 0 && (
            <View style={{ paddingHorizontal: 16, marginTop: 40, marginBottom: 32, alignItems: 'center' }}>
              <SectionHeader title={t('Our Sponsors', 'हमारे Sponsors')} />
              {sponsorGroups.map((g, gi) => {
                const isTop = gi === 0;
                const logoH = isTop ? 64 : gi === 1 ? 44 : 32;
                return (
                  <View key={g.label} style={{ marginTop: isTop ? 8 : 24, alignItems: 'center' }}>
                    <Text style={{ color: c.getAccentText(c.amber), fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: isTop ? 14 : 12, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
                      {g.label}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: isTop ? 16 : 12 }}>
                      {g.items.map((s, i) => {
                        const inner = (
                          <View style={{ backgroundColor: c.isDark ? c.card2 : '#1B2E52', borderRadius: 12, paddingHorizontal: logoH * 0.4, paddingVertical: logoH * 0.3, borderWidth: 1, borderColor: c.line }}>
                            {s.logo ? (
                              <Image source={{ uri: s.logo }} style={{ height: logoH, width: logoH * 3, maxWidth: 200 }} contentFit="contain" cachePolicy="memory-disk" />
                            ) : (
                              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: logoH * 0.4, color: '#FFFFFF' }}>{s.name}</Text>
                            )}
                          </View>
                        );
                        if (s.url) {
                          return (
                            <Pressable key={i} onPress={() => WebBrowser.openBrowserAsync(s.url!)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
                              {inner}
                            </Pressable>
                          );
                        }
                        return <View key={i}>{inner}</View>;
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )
        ), [sponsorGroups, c, t])}
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
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
