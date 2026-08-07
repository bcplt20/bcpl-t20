import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { theme } = useTheme();
  const c = THEMES[theme];
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
        <Stack.Screen name="pay-webview" options={{ title: 'Payment', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="pay-receipt" options={{ title: 'Receipt', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="kyc" options={{ title: 'KYC', headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: 'Profile', headerShown: false }} />
        <Stack.Screen name="classification" options={{ title: 'Playing Style', headerShown: false }} />
      </Stack>
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
    <SafeAreaProvider>
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
