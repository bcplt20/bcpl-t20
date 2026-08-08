import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, Platform, Dimensions, StyleSheet, ScrollView, Animated as RNAnimated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ScreenBackground, GlassAppBar, useAppBarHeight, Card, LoadingView, ErrorView } from '@/components/ui';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '@/lib/api';

export default function PlayerCardScreen() {
  const c = useColors();
  const { t } = useLang();
  const { user, token, ready } = useAuth();
  const router = useRouter();
  const appBarHeight = useAppBarHeight();
  const viewShotRef = useRef<any>(null);

  const dashQ = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => getDashboard(token as string),
    enabled: !!token && ready
  });

  const shimmerAnim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-Dimensions.get('window').width, Dimensions.get('window').width * 1.5]
  });

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
      
      {!ready ? null : !token ? (
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
      ) : dashQ.isLoading ? (
        <LoadingView />
      ) : dashQ.isError ? (
        <ErrorView onRetry={() => dashQ.refetch()} />
      ) : dashQ.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingTop: appBarHeight + 20, paddingBottom: 40 }}>
          
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
          <View style={{ width: w, height: h, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1A0B2E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <LinearGradient colors={['#5B2BF0', '#1A0B2E', '#FF3DA6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
            
            <RNAnimated.View style={[StyleSheet.absoluteFill, { width: w * 2, opacity: 0.15, transform: [{ translateX: shimmerTranslate }] }]} pointerEvents="none">
              <LinearGradient colors={['transparent', '#fff', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, transform: [{ skewX: '-20deg' }] }} />
            </RNAnimated.View>

            {/* Watermark */}
            <Text style={{ position: 'absolute', left: -20, bottom: 20, color: 'rgba(255,255,255,0.03)', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 80, transform: [{ rotate: '-10deg' }] }}>
              SEASON 5
            </Text>

            {/* Header */}
            <View style={{ padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Image source={require('../assets/images/bcpl-ball-clean.png')} style={{ width: 36, height: 36 }} contentFit="contain" />
                <View>
                  <Text style={{ color: '#00DCF5', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
                    Season 5
                  </Text>
                  <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18 }}>
                    BCPL T20
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 }}>
                  {dashQ.data.registration?.regNumber || user?.regNumber || '—'}
                </Text>
              </View>
            </View>

            {/* Photo */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 3, borderColor: '#00DCF5', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                {dashQ.data.avatar?.viewUrl || user?.avatar ? (
                  <Image source={{ uri: dashQ.data.avatar?.viewUrl || user?.avatar! }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 56 }}>
                    {(dashQ.data.user.name || user?.name || '?').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </View>

            {/* Footer details */}
            <View style={{ padding: 24, paddingBottom: 28, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 26, textAlign: 'center', marginBottom: 12 }} numberOfLines={1} adjustsFontSizeToFit>
                {dashQ.data.user.name || user?.name}
              </Text>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                  <Feather name={(dashQ.data.registration?.role || user?.role) === 'bat' ? 'target' : (dashQ.data.registration?.role || user?.role) === 'bowl' ? 'crosshair' : (dashQ.data.registration?.role || user?.role) === 'ar' ? 'zap' : 'shield'} size={12} color="#FF3DA6" />
                  <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, textTransform: 'uppercase' }}>
                    {(dashQ.data.registration?.role || user?.role) === 'bat' ? t('Batsman', 'बल्लेबाज़') : (dashQ.data.registration?.role || user?.role) === 'bowl' ? t('Bowler', 'गेंदबाज़') : (dashQ.data.registration?.role || user?.role) === 'ar' ? t('All-Rounder', 'ऑल-राउंडर') : t('Wicket Keeper', 'विकेट कीपर')}
                  </Text>
                </View>
                
                {dashQ.data.registration?.classification?.battingHand && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                    <Text style={{ color: '#00DCF5', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, textTransform: 'uppercase' }}>
                      {dashQ.data.registration.classification.battingHand === 'right' ? 'RH Bat' : 'LH Bat'}
                    </Text>
                  </View>
                )}

                {dashQ.data.registration?.classification?.bowlingType && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                    <Text style={{ color: '#00DCF5', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, textTransform: 'uppercase' }}>
                      {dashQ.data.registration.classification.bowlingType.replace('_', ' ')}
                    </Text>
                  </View>
                )}
                
                {dashQ.data.registration?.trialCity && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                    <Feather name="map-pin" size={12} color="#00DCF5" />
                    <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, textTransform: 'uppercase' }}>
                      {dashQ.data.registration.trialCity}
                    </Text>
                  </View>
                )}
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

        </ScrollView>
      ) : null}
    </View>
  );
}
