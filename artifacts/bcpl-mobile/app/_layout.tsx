import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AssistantOverlay, toggleAssistant, useAssistantState } from '@/components/AssistantOverlay';
import { THEMES } from '@/hooks/useColors';
import {
  useFonts,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, Pressable, Keyboard, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence } from 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function FloatingAiButton() {
  const { theme } = useTheme();
  const c = THEMES[theme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  const isAssistant = useAssistantState();

  // If we are in the tabs group, float above the bottom tab bar.
  // The tab bar is strictly 68px tall.
  const inTabs = !segments[0] || segments[0] === '(tabs)';
  // Position deterministically: 68 (tabbar) + 16 (gap) + safeArea
  const bottomMargin = inTabs ? 68 + insets.bottom + 16 : insets.bottom + 16;

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.5 - (pulse.value - 1),
  }));

  const iconRot = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const crossOpacity = useSharedValue(0);
  const sparkleOpacity = useSharedValue(1);

  useEffect(() => {
    if (isAssistant) {
      iconRot.value = withTiming(90, { duration: 300 });
      crossOpacity.value = withTiming(1, { duration: 300 });
      sparkleOpacity.value = withTiming(0, { duration: 300 });
    } else {
      iconRot.value = withTiming(0, { duration: 300 });
      crossOpacity.value = withTiming(0, { duration: 300 });
      sparkleOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [isAssistant]);

  const crossStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    opacity: crossOpacity.value,
    transform: [{ rotate: `${iconRot.value}deg` }]
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    opacity: sparkleOpacity.value,
    transform: [{ rotate: `${iconRot.value}deg` }]
  }));

  const handlePress = () => {
    toggleAssistant();
  };

  return (
    <View style={{
        position: 'absolute',
        bottom: bottomMargin,
        right: 16,
        width: 56,
        height: 56,
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'center',
    }} pointerEvents="box-none">
      <Animated.View style={[{ position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: '#F5B63F' }, glowStyle]} pointerEvents="none" />
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.92 : 1 }],
          shadowColor: '#F7C24A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.6,
          shadowRadius: 16,
          elevation: 12,
        })}
      >
        <LinearGradient colors={['#F7C24A', '#F5B63F', '#EE7A2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 28 }} />
        <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 28 }} />
        
        <Animated.View style={crossStyle} pointerEvents="none">
          <Feather name="x" size={26} color="#1B2E52" />
        </Animated.View>
        <Animated.View style={sparkleStyle} pointerEvents="none">
          <Ionicons name="sparkles" size={24} color="#1B2E52" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

import { usePushNotifications } from '@/hooks/usePushNotifications';

function RootLayoutNav() {
  const { theme } = useTheme();
  const c = THEMES[theme];
  usePushNotifications();
  return (
    <>
      <StatusBar style={theme === 'stadium' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.ink,
          headerTitleStyle: { fontFamily: 'PlusJakartaSans_600SemiBold' },
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ presentation: 'modal', title: 'Login', headerShown: false }}
        />
        <Stack.Screen name="register" options={{ title: 'Register', headerShown: false }} />
        <Stack.Screen name="pages/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="match/[id]" options={{ title: 'Match Center', headerShown: false }} />
        <Stack.Screen name="news/[slug]" options={{ title: 'News', headerShown: false }} />
        <Stack.Screen name="teams" options={{ title: 'Teams', headerShown: false }} />
        <Stack.Screen name="team/[id]" options={{ title: 'Team', headerShown: false }} />
        <Stack.Screen name="journey" options={{ title: 'My Journey', headerShown: false }} />
        <Stack.Screen name="upload-video" options={{ title: 'Upload Video', headerShown: false }} />
        <Stack.Screen name="phase2-pay" options={{ title: 'Phase 2', headerShown: false }} />
        <Stack.Screen name="result" options={{ title: 'Phase 1 Result', headerShown: false }} />
        <Stack.Screen name="trial-pass" options={{ title: 'Trial Pass', headerShown: false }} />
        <Stack.Screen name="vote" options={{ title: 'Fan Voting', headerShown: false }} />
        <Stack.Screen name="mvp" options={{ title: 'MVP Race', headerShown: false }} />
        <Stack.Screen name="pay-webview" options={{ title: 'Payment', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="pay-receipt" options={{ title: 'Receipt', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="kyc" options={{ title: 'KYC', headerShown: false }} />
        <Stack.Screen name="about" options={{ title: 'About', headerShown: false }} />
        <Stack.Screen name="jersey-backfill" options={{ title: 'Jersey Backfill', headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
        <Stack.Screen name="classification" options={{ title: 'Playing Style', headerShown: false }} />
        <Stack.Screen name="scorer/new" options={{ title: 'New Match', headerShown: false }} />
        <Stack.Screen name="scorer/[id]" options={{ title: 'Scoring', headerShown: false }} />
      </Stack>
      <FloatingAiButton />
      <AssistantOverlay />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    SpaceGrotesk_700Bold,
    ...Feather.font,
    ...Ionicons.font,
  });

  // Android (Expo Go over the network): a one-shot font load can fail and leave
  // icon glyphs as tofu boxes. Retry the icon fonts a few times before rendering.
  const [retriedOk, setRetriedOk] = React.useState(false);
  useEffect(() => {
    if (!fontError) return;
    console.warn('[fonts] initial load failed, retrying icon fonts:', fontError);
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 3 && !cancelled; i++) {
        try {
          await Font.loadAsync({ ...Feather.font, ...Ionicons.font });
          if (!cancelled) setRetriedOk(true);
          return;
        } catch (e) {
          console.warn(`[fonts] retry ${i + 1} failed:`, e);
          await new Promise((r) => setTimeout(r, 800 * (i + 1)));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;
  void retriedOk; // re-render trigger once icon fonts finally load

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <GestureHandlerRootView>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
