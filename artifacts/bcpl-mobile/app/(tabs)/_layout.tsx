import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useLang } from '@/context/LanguageContext';
import { Text } from 'react-native';

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
          colors={[c.mesh3, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Feather name={feather} size={22} color={focused ? c.ink : c.sub} />
    </View>
  );
}

function FabTab() {
  const { t } = useLang();
  return (
    <View style={{ top: -16, alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient
        colors={['#FF3DA6', '#9B2FF0', '#5B2BF0']}
        style={{ paddingHorizontal: 14, paddingVertical: 12, borderRadius: 24, flexDirection: 'row', alignItems: 'center', shadowColor: '#FF3DA6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6, gap: 6 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Feather name="edit-3" size={14} color="#fff" />
        <Text style={{ color: '#fff', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 13, letterSpacing: 0.5 }}>
          {t('Register', 'रजिस्टर')}
        </Text>
      </LinearGradient>
    </View>
  );
}

export default function TabLayout() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
          left: 12,
          right: 12,
          height: 68,
          borderRadius: 34,
          backgroundColor: c.glass,
          borderWidth: 1,
          borderColor: c.line,
          elevation: 10,
          shadowColor: c.isDark ? '#000' : '#2D196E',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: c.isDark ? 0.34 : 0.09,
          shadowRadius: 26,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          height: 68,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarBackground: () => (
          <BlurView intensity={80} tint={c.isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 34, overflow: 'hidden' }]} />
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: (props) => <TabIcon feather="home" {...props} name="Home" />, tabBarItemStyle: { flex: 1.5, alignItems: 'center', justifyContent: 'center' } }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: (props) => <TabIcon feather="calendar" {...props} name="Matches" />, tabBarItemStyle: { flex: 1.5, alignItems: 'center', justifyContent: 'center' } }} />
      <Tabs.Screen 
        name="register-fab" 
        options={{ 
          title: 'Register', 
          tabBarIcon: () => <FabTab />,
          tabBarItemStyle: { flex: 0, width: 104, alignItems: 'center', justifyContent: 'center' }
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push('/register');
          },
        })}
      />
      <Tabs.Screen name="points" options={{ title: 'Points', tabBarIcon: (props) => <TabIcon feather="bar-chart-2" {...props} name="Points" />, tabBarItemStyle: { flex: 1, alignItems: 'center', justifyContent: 'center' } }} />
      <Tabs.Screen name="media" options={{ title: 'Media', tabBarIcon: (props) => <TabIcon feather="play-circle" {...props} name="Media" />, tabBarItemStyle: { flex: 1, alignItems: 'center', justifyContent: 'center' } }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: (props) => <TabIcon feather="menu" {...props} name="More" />, tabBarItemStyle: { flex: 1, alignItems: 'center', justifyContent: 'center' } }} />
      
      <Tabs.Screen name="news" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGlow: {
    borderRadius: 24,
    overflow: 'hidden',
  },
});
