import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="matches">
        <Icon sf={{ default: 'sportscourt', selected: 'sportscourt.fill' }} />
        <Label>Matches</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="points">
        <Icon sf={{ default: 'list.number', selected: 'list.number' }} />
        <Label>Points</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="news">
        <Icon sf={{ default: 'newspaper', selected: 'newspaper.fill' }} />
        <Label>News</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  const icon =
    (feather: keyof typeof Feather.glyphMap, sf: string) =>
    ({ color }: { color: string }) =>
      isIOS ? (
        <SymbolView name={sf as never} tintColor={color} size={24} />
      ) : (
        <Feather name={feather} size={22} color={color} />
      );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: isWeb ? 1 : StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'house') }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: icon('calendar', 'sportscourt') }} />
      <Tabs.Screen name="points" options={{ title: 'Points', tabBarIcon: icon('bar-chart-2', 'list.number') }} />
      <Tabs.Screen name="news" options={{ title: 'News', tabBarIcon: icon('file-text', 'newspaper') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('user', 'person.crop.circle') }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
