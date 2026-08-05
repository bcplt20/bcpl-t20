import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

function TabIcon({ name, focused, color, feather }: { name: string; focused: boolean; color: string; feather: keyof typeof Feather.glyphMap }) {
  const c = useColors();
  const scale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 40,
    }).start();
  }, [focused]);

  return (
    <View style={styles.iconContainer}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.activeGlow,
          {
            opacity: scale,
            transform: [{ scale: scale.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 107, 0, 0.4)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Feather name={feather} size={22} color={focused ? c.primary : c.mutedForeground} />
      <Animated.View
        style={[
          styles.activeDot,
          {
            backgroundColor: c.primary,
            opacity: scale,
            transform: [{ scale: scale.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }, { translateY: 4 }],
          },
        ]}
      />
    </View>
  );
}

export default function TabLayout() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  const bottomPadding = isWeb ? 20 : Math.max(20, insets.bottom + 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomPadding,
          left: 20,
          right: 20,
          height: 64,
          borderRadius: 32,
          backgroundColor: isIOS ? 'transparent' : 'rgba(22, 36, 69, 0.95)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          paddingBottom: 0, // override default padding
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }]} />
          ) : (
            <LinearGradient
              colors={['rgba(22,36,69,0.95)', 'rgba(15,25,46,0.95)']}
              style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
            />
          ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: (props) => <TabIcon feather="home" {...props} name="Home" /> }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: (props) => <TabIcon feather="calendar" {...props} name="Matches" /> }} />
      <Tabs.Screen name="points" options={{ title: 'Points', tabBarIcon: (props) => <TabIcon feather="bar-chart-2" {...props} name="Points" /> }} />
      <Tabs.Screen name="news" options={{ title: 'News', tabBarIcon: (props) => <TabIcon feather="file-text" {...props} name="News" /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: (props) => <TabIcon feather="user" {...props} name="Profile" /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGlow: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
