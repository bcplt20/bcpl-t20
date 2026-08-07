import { useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

/**
 * DEV-ONLY helper for screenshot/testing sessions (Expo web only).
 * Writes the auth blob to localStorage from query params, then redirects.
 * Compiled out of production builds via __DEV__; renders nothing otherwise.
 * Usage: /dev-login?token=...&uid=...&name=...&phone=...&to=/journey
 */
export default function DevLogin() {
  const params = useLocalSearchParams<{ token?: string; uid?: string; name?: string; phone?: string; to?: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!__DEV__ || Platform.OS !== 'web') return;
    const { token, uid, name, phone, to } = params;
    if (!token || !uid) return;
    try {
      window.localStorage.setItem(
        'bcpl_mobile_auth_v1',
        JSON.stringify({ token, user: { id: uid, name: name || 'Player', phone: phone || '' } }),
      );
      window.location.replace(String(to || '/journey'));
    } catch {}
  }, [params.token]);

  if (!__DEV__) return null;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>dev-login…</Text>
    </View>
  );
}
