import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, Pressable, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '@/context/LanguageContext';

function RegisterFabButton({ onPress }: { onPress: () => void }) {
  const { t } = useLang();
  const c = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [anim]);

  return (
    <View style={{ width: 84, height: 64, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 }}>
      <Pressable
        onPress={onPress}
        style={{
          position: 'absolute',
          top: -24,
          width: 64,
          height: 64,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View style={{
          position: 'absolute',
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: '#FF3DA6',
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] }),
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }]
        }} />
        <View style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#FF3DA6',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          elevation: 6,
          backgroundColor: c.isDark ? '#1E1A33' : '#FFF',
          borderWidth: 2,
          borderColor: '#FF3DA6'
        }}>
          <LinearGradient
            colors={['#FF3DA6', '#9B2FF0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[{ borderRadius: 25, opacity: c.isDark ? 0.2 : 0.1 }, StyleSheet.absoluteFill]}
          />
          {/* subtle seam lines for cricket ball look */}
          <View style={{ position: 'absolute', left: 16, top: -2, bottom: -2, width: 2, backgroundColor: c.magenta, opacity: 0.2, transform: [{ rotate: '15deg' }] }} />
          <View style={{ position: 'absolute', right: 16, top: -2, bottom: -2, width: 2, backgroundColor: c.magenta, opacity: 0.2, transform: [{ rotate: '15deg' }] }} />
          
          <Feather name="zap" size={22} color={c.magenta} style={{ zIndex: 2 }} />
        </View>
      </Pressable>
      <Text style={{ color: c.magenta, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 10, letterSpacing: 0.3, zIndex: 3 }}>
        {t('Register', 'रजिस्टर')}
      </Text>
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLang();
  const router = useRouter();
  
  const isWeb = Platform.OS === 'web';
  const bottomPadding = isWeb ? 20 : Math.max(20, insets.bottom + 8);
  const barHeight = 64;

  const routes = state.routes.filter((r: any) => !['points', 'news'].includes(r.name));

  return (
    <View style={{
      position: 'absolute',
      bottom: bottomPadding,
      left: 12,
      right: 12,
      height: barHeight,
      borderRadius: 32,
      elevation: 10,
      shadowColor: c.isDark ? '#000' : '#2D196E',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: c.isDark ? 0.34 : 0.09,
      shadowRadius: 26,
    }}>
      <BlurView intensity={80} tint={c.isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: c.line }]} />
      
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        {routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          
          if (route.name === 'register-fab') {
            return <RegisterFabButton key={route.key} onPress={() => router.push('/register')} />;
          }
          
          let iconName: keyof typeof Feather.glyphMap = 'home';
          if (route.name === 'matches') iconName = 'calendar';
          if (route.name === 'media') iconName = 'play-circle';
          if (route.name === 'more') iconName = 'menu';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: barHeight }}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={iconName} size={22} color={isFocused ? c.ink : c.sub} />
                {isFocused && (
                  <LinearGradient
                    colors={['#FF3DA6', '#9B2FF0']}
                    style={{ position: 'absolute', bottom: -8, width: 4, height: 4, borderRadius: 2 }}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="matches" />
      <Tabs.Screen name="register-fab" />
      <Tabs.Screen name="media" />
      <Tabs.Screen name="more" />
      <Tabs.Screen name="points" options={{ href: null }} />
      <Tabs.Screen name="news" options={{ href: null }} />
    </Tabs>
  );
}
