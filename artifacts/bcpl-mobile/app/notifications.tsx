import React, { useCallback } from 'react';
import { View, ScrollView, Text, Pressable, RefreshControl, StyleSheet, Platform, FlatList } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationsRead } from '@/lib/api';
import { ScreenBackground, GlassAppBar, useAppBarHeight, LoadingView, ErrorView, Card } from '@/components/ui';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotificationsScreen() {
  const c = useColors();
  const { t } = useLang();
  const { token, ready } = useAuth();
  const router = useRouter();
  const appBarHeight = useAppBarHeight();
  const queryClient = useQueryClient();

  const q = useQuery({ 
    queryKey: ['notifications', token], 
    queryFn: () => getNotifications(token as string), 
    staleTime: 60 * 1000,
    enabled: !!token && ready
  });
  const markRead = useMutation({
    mutationFn: (ids?: string[]) => markNotificationsRead(token as string, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', token] });
    }
  });

  // Mark all as read when opening if there are unread
  React.useEffect(() => {
    if (q.data?.unreadCount && q.data.unreadCount > 0) {
      const unreadIds = q.data.notifications.filter(n => !n.readAt).map(n => n.id);
      if (unreadIds.length > 0) {
        markRead.mutate(unreadIds);
      }
    }
  }, [q.data?.unreadCount]);

  const onRefresh = useCallback(() => {
    q.refetch();
  }, [q]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'match': return <Feather name="play-circle" size={18} color={c.cyan} />;
      case 'badge': return <Feather name="award" size={18} color={c.magenta} />;
      case 'system': return <Feather name="bell" size={18} color={c.violet} />;
      case 'referral': return <Feather name="users" size={18} color="#FFC53D" />;
      default: return <Feather name="message-circle" size={18} color={c.sub} />;
    }
  };

  const getRelativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <GlassAppBar title={t('Notifications', 'नोटिफिकेशन')} />
      
      {!ready || q.isLoading ? (
        <LoadingView />
      ) : !token ? (
        <ScrollView contentContainerStyle={{ paddingTop: appBarHeight + 40, paddingHorizontal: 16 }}>
          <Card style={{ alignItems: 'center', paddingVertical: 36 }}>
            <Feather name="lock" size={28} color={c.magenta} />
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
              {t('Log in to see notifications', 'नोटिफिकेशन देखने के लिए लॉगिन करें')}
            </Text>
            <Pressable onPress={() => router.push('/login')} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 14, overflow: 'hidden', paddingHorizontal: 24, marginTop: 24, opacity: pressed ? 0.85 : 1 }]}>
              <LinearGradient colors={['#FF1A75', '#D10056']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }}>{t('Login with OTP', 'OTP से लॉगिन')}</Text>
            </Pressable>
          </Card>
        </ScrollView>
      ) : q.isError ? (
        <ErrorView onRetry={() => q.refetch()} />
      ) : (
        <ScrollView 
          contentContainerStyle={{ paddingTop: appBarHeight + 16, paddingBottom: 60, paddingHorizontal: 16 }}
          refreshControl={<RefreshControl refreshing={q.isFetching && !q.isLoading} onRefresh={onRefresh} tintColor={c.magenta} />}
        >
          {q.data?.notifications?.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center', marginTop: 40 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${c.violet}1A`, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: `${c.violet}33` }}>
                <Feather name="bell-off" size={32} color={c.violet} />
              </View>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, textAlign: 'center', marginBottom: 8 }}>
                {t('All caught up!', 'कोई नया नोटिफिकेशन नहीं')}
              </Text>
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, textAlign: 'center' }}>
                {t("We'll notify you about live matches, badges, and important updates.", 'लाइव मैच, बैज और ज़रूरी अपडेट्स की सूचना यहाँ मिलेगी।')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={q.data?.notifications}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12 }}
              scrollEnabled={false}
              renderItem={({ item: n }) => (
                <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: n.readAt ? c.line : c.magenta, opacity: n.readAt ? 0.7 : 1 }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.line }}>
                      {getIcon(n.type)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, flex: 1, marginRight: 8 }} numberOfLines={2}>{n.title}</Text>
                        <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 }}>{getRelativeTime(n.createdAt)}</Text>
                      </View>
                      <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, marginTop: 4, lineHeight: 20 }}>{n.body}</Text>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}
