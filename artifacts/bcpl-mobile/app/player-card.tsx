import React, { useRef } from 'react';
import { View, Text, Pressable, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ScreenBackground, GlassAppBar, useAppBarHeight, Card } from '@/components/ui';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';

export default function PlayerCardScreen() {
  const c = useColors();
  const { t } = useLang();
  const { user, ready } = useAuth();
  const router = useRouter();
  const appBarHeight = useAppBarHeight();
  const viewShotRef = useRef<any>(null);

  const handleShare = async () => {
    if (!viewShotRef.current?.capture) return;
    try {
      const uri = await viewShotRef.current.capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      console.log('Share error', e);
    }
  };

  const w = Dimensions.get('window').width - 48;
  const h = w * 1.5;

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <GlassAppBar title={t('Player Card', 'प्लेयर कार्ड')} back />
      
      {!ready ? null : !user ? (
        <View style={{ flex: 1, paddingTop: appBarHeight + 40, paddingHorizontal: 16 }}>
          <Card style={{ alignItems: 'center', paddingVertical: 36 }}>
            <Feather name="lock" size={28} color={c.magenta} />
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
              {t('Log in to see your player card', 'अपना प्लेयर कार्ड देखने के लिए लॉगिन करें')}
            </Text>
            <Pressable onPress={() => router.push('/login')} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 14, overflow: 'hidden', paddingHorizontal: 24, marginTop: 24, opacity: pressed ? 0.85 : 1 }]}>
              <LinearGradient colors={['#FF1A75', '#D10056']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 14 }} />
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 15 }}>{t('Login with OTP', 'OTP से लॉगिन')}</Text>
            </Pressable>
          </Card>
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: appBarHeight, paddingBottom: 24 }}>
          
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
          <View style={{ width: w, height: h, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1A0B2E' }}>
            <LinearGradient colors={['#5B2BF0', '#1A0B2E', '#FF3DA6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.8 }} />
            
            {/* Watermark */}
            <Image source={require('../assets/images/bcpl-ball-clean.png')} style={{ position: 'absolute', right: -40, bottom: -40, width: 200, height: 200, opacity: 0.15 }} contentFit="contain" />

            {/* Header */}
            <View style={{ padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#00DCF5', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
                  Season 5
                </Text>
                <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 4 }}>
                  BCPL
                </Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 }}>
                  {user.regNumber || '—'}
                </Text>
              </View>
            </View>

            {/* Photo */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 4, borderColor: '#FF3DA6', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 64 }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </View>

            {/* Footer details */}
            <View style={{ padding: 24, paddingBottom: 32, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 28, textAlign: 'center', marginBottom: 8 }}>
                {user.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                <Feather name={user.role === 'bat' ? 'target' : user.role === 'bowl' ? 'crosshair' : user.role === 'ar' ? 'zap' : 'shield'} size={14} color="#00DCF5" />
                <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, textTransform: 'uppercase' }}>
                  {user.role === 'bat' ? t('Batsman', 'बल्लेबाज़') : user.role === 'bowl' ? t('Bowler', 'गेंदबाज़') : user.role === 'ar' ? t('All-Rounder', 'ऑल-राउंडर') : t('Wicket Keeper', 'विकेट कीपर')}
                </Text>
              </View>
            </View>
          </View>
        </ViewShot>

        <Pressable onPress={handleShare} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.card, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20, marginTop: 32, borderWidth: 1, borderColor: c.magenta, opacity: pressed ? 0.8 : 1 })}>
          <Feather name="share-2" size={18} color={c.ink} />
          <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 }}>
            {t('Share Card', 'कार्ड शेयर करें')}
          </Text>
        </Pressable>

        </View>
      )}
    </View>
  );
}
