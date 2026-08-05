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
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { getDashboard } from '@/lib/api';
import { Badge, Card, ErrorView, LoadingView } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';

function StatusRow({ label, value, done }: { label: string; value: string; done?: boolean }) {
  const c = useColors();
  return (
    <View style={styles.statusRow}>
      <Feather
        name={done ? 'check-circle' : 'circle'}
        size={17}
        color={done ? c.success : c.mutedForeground}
      />
      <Text style={{ color: c.foreground, fontSize: 13.5, flex: 1, fontFamily: 'Inter_500Medium' }}>{label}</Text>
      <Text style={{ color: done ? c.success : c.mutedForeground, fontSize: 12.5, fontFamily: 'Inter_600SemiBold' }}>
        {value}
      </Text>
    </View>
  );
}

function niceStatus(s?: string | null): string {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function ProfileScreen() {
  const c = useColors();
  const router = useRouter();
  const { token, user, ready, logout } = useAuth();

  const dashQ = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => getDashboard(token as string),
    enabled: !!token,
  });

  if (!ready) return <LoadingView />;

  if (!token) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <ScreenHeader title="Profile" />
        <View style={styles.loginWrap}>
          <Feather name="user" size={40} color={c.mutedForeground} />
          <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 14 }}>
            अपने BCPL account में login करें
          </Text>
          <Text style={{ color: c.mutedForeground, textAlign: 'center', marginTop: 6, fontSize: 13.5, lineHeight: 20 }}>
            वही phone number use करें जिससे आपने bcplt20.com पर register किया था — OTP से login होगा
          </Text>
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.loginBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
            testID="login-button"
          >
            <Text style={{ color: c.primaryForeground, fontFamily: 'Inter_700Bold', fontSize: 15 }}>
              Login with OTP
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const d = dashQ.data;
  const reg = d?.registration;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : 100 }}
        refreshControl={
          <RefreshControl refreshing={dashQ.isRefetching} onRefresh={() => dashQ.refetch()} tintColor={c.primary} />
        }
      >
        <ScreenHeader title={user?.name ?? 'Player'} subtitle={user?.phone} />
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {dashQ.isLoading ? (
            <LoadingView />
          ) : dashQ.isError ? (
            <ErrorView onRetry={() => dashQ.refetch()} />
          ) : !d?.registered ? (
            <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
              <Feather name="edit-3" size={26} color={c.accent} />
              <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold', marginTop: 10, textAlign: 'center' }}>
                इस season की registration bcplt20.com पर करें
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12.5, marginTop: 4, textAlign: 'center' }}>
                Registration पूरी होते ही आपका dashboard यहाँ दिखेगा
              </Text>
            </Card>
          ) : (
            <>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: c.mutedForeground, fontSize: 11.5 }}>REGISTRATION NO.</Text>
                    <Text style={{ color: c.accent, fontFamily: 'Inter_700Bold', fontSize: 19, marginTop: 2 }}>
                      {reg?.regNumber ?? '—'}
                    </Text>
                  </View>
                  {reg?.role ? <Badge label={reg.role} tone="gold" /> : null}
                </View>
                {reg?.trialCity ? (
                  <Text style={{ color: c.mutedForeground, fontSize: 12.5, marginTop: 8 }}>
                    Trial city: {reg.trialCity}
                  </Text>
                ) : null}
              </Card>

              <Card>
                <Text style={[styles.cardTitle, { color: c.foreground }]}>आपका season journey</Text>
                <StatusRow
                  label="Phase 1 — Registration"
                  value={niceStatus(reg?.phase1Status)}
                  done={['selected', 'video_submitted', 'payment_done'].includes(reg?.phase1Status ?? '')}
                />
                <StatusRow
                  label="Trial video"
                  value={d.video?.submitted ? 'Submitted' : 'Pending'}
                  done={!!d.video?.submitted}
                />
                <StatusRow
                  label="Phase 2 — KYC"
                  value={niceStatus(d.kyc?.status ?? reg?.phase2Status)}
                  done={(d.kyc?.status ?? '') === 'approved'}
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
                />
              </Card>

              {(d.phase1Payment || d.phase2Payment) && (
                <Card>
                  <Text style={[styles.cardTitle, { color: c.foreground }]}>Payments</Text>
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
                </Card>
              )}
            </>
          )}

          <Pressable
            onPress={() => logout()}
            style={({ pressed }) => [
              styles.logoutBtn,
              { borderColor: c.border, opacity: pressed ? 0.7 : 1 },
            ]}
            testID="logout-button"
          >
            <Feather name="log-out" size={16} color={c.destructive} />
            <Text style={{ color: c.destructive, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loginWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  loginBtn: {
    marginTop: 22,
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 14,
  },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 14.5, marginBottom: 8 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
});
