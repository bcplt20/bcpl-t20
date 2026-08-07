import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { getProfileCompletion } from '@/lib/api';

export function ProfileBackfillCard() {
  const c = useColors();
  const { t } = useLang();
  const router = useRouter();
  const { token } = useAuth();

  const qc = useQuery({
    queryKey: ['profileCompletion', token],
    queryFn: () => getProfileCompletion(token as string),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  // Only show if the user is authenticated, we have data, and they need backfill.
  // The API already checks that they are KYC done and logged in.
  if (!qc.data || !qc.data.needsBackfill) return null;

  return (
    <Pressable
      onPress={() => router.push('/jersey-backfill')}
      style={({ pressed }) => [
        {
          marginHorizontal: 20,
          marginBottom: 16,
          borderRadius: 16,
          overflow: 'hidden',
        },
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
    >
      <LinearGradient
        colors={['#FF1A75', '#D10056']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 18, flexDirection: 'row', alignItems: 'center' }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
          <Feather name="alert-circle" size={24} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16, marginBottom: 4 }}>
            {t('अपनी jersey sizes भरें', 'Complete your jersey sizes')}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 18 }}>
            {t('ये trials के लिए नहीं हैं, पर auction/team के लिए ज़रूरी हैं।', 'These are not for trials, but required for the auction/team phase.')}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color="#fff" style={{ opacity: 0.8 }} />
      </LinearGradient>
    </Pressable>
  );
}
