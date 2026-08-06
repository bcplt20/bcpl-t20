import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { getDashboard } from '@/lib/api';
import {
  Card,
  ErrorView,
  LoadingView,
  GlassAppBar,
  ScreenBackground,
  useAppBarHeight,
} from '@/components/ui';

// Player details screen — mirrors the website profile: Name, Phone, Email,
// Trial city, Registration number, Role, Season. Data comes from the same
// /user/dashboard endpoint the More tab already uses.
export default function ProfileDetailsScreen() {
  const c = useColors();
  const { token, user, ready } = useAuth();
  const { t } = useLang();
  const appBarHeight = useAppBarHeight();

  const dashQ = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => getDashboard(token as string),
    enabled: !!token,
  });

  if (!ready) return <LoadingView />;

  const d = dashQ.data;
  const reg = d?.registration;

  const rows: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string }[] = [
    { icon: 'user', label: t('Full Name', 'पूरा नाम'), value: user?.name || '—' },
    { icon: 'phone', label: t('Phone', 'फ़ोन'), value: user?.phone ? `+91 ${user.phone.replace(/^\+?91/, '')}` : '—' },
    { icon: 'mail', label: t('Email', 'ईमेल'), value: user?.email || t('Not provided', 'नहीं दिया गया') },
    { icon: 'hash', label: t('Registration No.', 'रजिस्ट्रेशन नं.'), value: reg?.regNumber || '—' },
    { icon: 'award', label: t('Role', 'रोल'), value: reg?.role || '—' },
    { icon: 'map-pin', label: t('Trial City', 'ट्रायल शहर'), value: reg?.trialCity || '—' },
    { icon: 'calendar', label: t('Season', 'सीज़न'), value: '5 · 2025–26' },
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
            {/* Header identity block */}
            <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
              <View style={[styles.avatar, { borderColor: c.line, backgroundColor: c.card2 }]}>
                <Feather name="user" size={40} color={c.magenta} />
              </View>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, marginTop: 16, textAlign: 'center' }}>
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
                {rows.map((row, i) => (
                  <View
                    key={row.label}
                    style={[
                      styles.detailRow,
                      i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
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
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
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
});
