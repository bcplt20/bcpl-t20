import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, Pressable, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, G } from 'react-native-svg';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '@/context/LanguageContext';

const TabIcon = ({ name, active, size = 22, color, c }: { name: string, active: boolean, size?: number, color: string, c: any }) => {
  let iconName: any = 'home-outline';
  let label = 'Home';
  
  if (name === 'home') {
    iconName = active ? 'home' : 'home-outline';
    label = 'Home';
  } else if (name === 'matches') {
    iconName = active ? 'calendar' : 'calendar-outline';
    label = 'Schedule';
  } else if (name === 'scorer') {
    iconName = active ? 'reader' : 'reader-outline';
    label = 'Scoring';
  } else if (name === 'media') {
    iconName = active ? 'images' : 'images-outline';
    label = 'Photos';
  } else if (name === 'more') {
    iconName = active ? 'menu' : 'menu-outline';
    label = 'Menu';
  }

  const textColor = active ? c.magenta : color;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4, width: 60 }}>
      {active && <View style={{ position: 'absolute', width: size * 1.6, height: size * 1.6, borderRadius: size * 0.8, backgroundColor: c.magenta, opacity: 0.1, top: -4 }} />}
      <Ionicons name={iconName} size={size} color={textColor} />
      <Text style={{ color: textColor, fontFamily: active ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold', fontSize: 10, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}

function RegisterFabButton({ onPress }: { onPress: () => void }) {
  const { t } = useLang();
  const c = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1500, useNativeDriver: true })
      ])
    );
    pulse.start();
    
    return () => {
      pulse.stop();
    };
  }, [anim]);

  return (
    <View style={{ width: 84, height: 64, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Register"
        style={({pressed}) => ({
          position: 'absolute',
          top: -24,
          width: 64,
          height: 64,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.95 : 1 }]
        })}
      >
        <Animated.View style={{
          position: 'absolute',
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: '#FF3DA6',
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.35] }),
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }],
          zIndex: 1
        }} />

        <View style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#FF3DA6',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: c.isDark ? 0.6 : 0.4,
          shadowRadius: 10,
          elevation: 8,
          borderWidth: 1.5,
          borderColor: 'rgba(255, 61, 166, 0.8)',
          overflow: 'hidden',
          zIndex: 2
        }}>
          <LinearGradient
            colors={['#7C5CFF', '#FF3DA6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          
          <Svg width={26} height={26} viewBox="0 0 24 24" style={{ marginLeft: 2, zIndex: 10 }}>
            <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M14 2v6h6v4" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8 12h4" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8 16h2" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M19.5 7.5a2.121 2.121 0 0 1 3 3L14 19l-4 1 1-4 8.5-8.5z" fill="#FFFFFF" fillOpacity="0.2" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx="10" cy="20" r="2.5" fill="#00DCF5" stroke="#000000" strokeOpacity="0.2" strokeWidth="1" />
          </Svg>
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
  const barHeight = 68;

  const routes = state.routes.filter((r: any) => !['points', 'news', 'media'].includes(r.name));

  return (
    <View style={{
      position: 'absolute',
      bottom: bottomPadding,
      left: 0,
      right: 0,
      alignItems: 'center',
      pointerEvents: 'box-none',
    }}>
      <View style={{
        width: '100%',
        maxWidth: 440,
        paddingHorizontal: 16,
        pointerEvents: 'auto',
      }}>
        <View style={{
          height: barHeight,
          borderRadius: 34,
          elevation: 8,
          shadowColor: c.isDark ? '#000' : '#2D196E',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: c.isDark ? 0.4 : 0.08,
          shadowRadius: 30,
          backgroundColor: Platform.OS === 'android' ? (c.isDark ? '#120D1E' : '#FFFFFF') : (c.isDark ? 'rgba(11, 8, 19, 0.7)' : 'rgba(255, 255, 255, 0.8)'),
        }}>
      {Platform.OS !== 'android' && (
            <BlurView intensity={c.isDark ? 50 : 80} tint={c.isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 34, overflow: 'hidden' }]} />
          )}
          <View style={[StyleSheet.absoluteFill, { borderRadius: 34, borderWidth: 1, borderColor: c.line }]} pointerEvents="none" />
      
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        {routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          // state.index refers to the FULL route list — compare by key, not the
          // filtered array's index, or focus highlights the wrong tab.
          const isFocused = state.routes[state.index]?.key === route.key;

          if (route.name === 'register-fab') {
            return <RegisterFabButton key={route.key} onPress={() => router.push('/register')} />;
          }

          // TabIcon draws by route name: 'home' | 'matches' | 'media' | 'more'
          const iconName = route.name === 'index' ? 'home' : route.name;

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
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={
                route.name === 'index' ? t('Home', 'होम') :
                route.name === 'matches' ? t('Schedule', 'शेड्यूल') :
                route.name === 'scorer' ? t('Scoring', 'स्कोरिंग') :
                t('Menu', 'मेनू')
              }
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: barHeight }}
            >
              <View style={{ 
                alignItems: 'center', 
                justifyContent: 'center',
                paddingHorizontal: 4,
                paddingVertical: 4,
              }}>
                <TabIcon name={iconName} active={isFocused} color={c.sub} c={c} size={22} />
              </View>
            </Pressable>
          );
        })}
      </View>
        </View>
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
      <Tabs.Screen name="scorer" />
      <Tabs.Screen name="more" />
      <Tabs.Screen name="media" options={{ href: null }} />
      <Tabs.Screen name="points" options={{ href: null }} />
      <Tabs.Screen name="news" options={{ href: null }} />
    </Tabs>
  );
}
