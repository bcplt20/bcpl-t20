import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, Pressable, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, { Path, Rect, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, G } from 'react-native-svg';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '@/context/LanguageContext';


const TabIcon = ({ name, active, size = 26, color, c }: { name: string, active: boolean, size?: number, color: string, c: any }) => {
  const gradientId = `grad-${name}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={c.cyan} />
          <Stop offset="1" stopColor={c.magenta} />
        </SvgLinearGradient>
      </Defs>
      {name === 'home' && (
        <Path 
          d="M3 10L12 3l9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10z" 
          stroke={active ? `url(#${gradientId})` : color} 
          strokeWidth={active ? 2.5 : 2} 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill={active ? `url(#${gradientId})` : 'none'} 
          fillOpacity={active ? 0.2 : 0} 
        />
      )}
      {name === 'matches' && (
        <G>
          <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" 
            stroke={active ? `url(#${gradientId})` : color} 
            strokeWidth={active ? 2.5 : 2} 
            strokeLinecap="round" strokeLinejoin="round"
            fill={active ? `url(#${gradientId})` : 'none'} fillOpacity={active ? 0.15 : 0}
          />
          <Path d="M16 2v4M8 2v4M3 10h18" stroke={active ? `url(#${gradientId})` : color} strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" />
          {active && <Rect x="7" y="14" width="4" height="4" rx="1" fill={`url(#${gradientId})`} />}
        </G>
      )}
      {name === 'media' && (
        <G>
          <Circle cx="12" cy="12" r="10" 
            stroke={active ? `url(#${gradientId})` : color} 
            strokeWidth={active ? 2.5 : 2} 
            strokeLinecap="round" strokeLinejoin="round"
            fill={active ? `url(#${gradientId})` : 'none'} fillOpacity={active ? 0.15 : 0}
          />
          <Path d="M10 8l6 4-6 4V8z" 
            stroke={active ? `url(#${gradientId})` : color} 
            strokeWidth={active ? 2.5 : 2} 
            strokeLinecap="round" strokeLinejoin="round"
            fill={active ? `url(#${gradientId})` : 'none'} 
          />
        </G>
      )}
      {name === 'more' && (
        <G>
          <Path d="M3 12h18M3 6h18M3 18h12" 
            stroke={active ? `url(#${gradientId})` : color} 
            strokeWidth={active ? 2.5 : 2} 
            strokeLinecap="round" strokeLinejoin="round"
          />
          {active && <Circle cx="19" cy="18" r="2" fill={`url(#${gradientId})`} />}
        </G>
      )}
    </Svg>
  );
}

function RegisterFabButton({ onPress }: { onPress: () => void }) {
  const { t } = useLang();
  const c = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1500, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <View style={{ width: 84, height: 64, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 }}>
      <Pressable
        onPress={onPress}
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
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }]
        }} />
        <View style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#FF3DA6',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: c.isDark ? 0.6 : 0.4,
          shadowRadius: 12,
          elevation: 8,
          backgroundColor: c.isDark ? '#160934' : '#2D196E',
          borderWidth: 1.5,
          borderColor: 'rgba(255, 61, 166, 0.8)',
          overflow: 'hidden'
        }}>
          <LinearGradient
            colors={['rgba(255, 61, 166, 0.3)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* subtle seam lines for cricket ball look */}
          <View style={{ position: 'absolute', left: 16, top: -5, bottom: -5, width: 2, backgroundColor: '#FF3DA6', opacity: 0.3, transform: [{ rotate: '20deg' }] }} />
          <View style={{ position: 'absolute', right: 16, top: -5, bottom: -5, width: 2, backgroundColor: '#FF3DA6', opacity: 0.3, transform: [{ rotate: '-20deg' }] }} />
          
          <Feather name="zap" size={24} color="#FFF" style={{ zIndex: 2 }} />
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

  const routes = state.routes.filter((r: any) => !['points', 'news'].includes(r.name));

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
              <View style={{ 
                alignItems: 'center', 
                justifyContent: 'center',
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}>
                <TabIcon name={iconName} active={isFocused} color={c.sub} c={c} size={24} />
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
      <Tabs.Screen name="media" />
      <Tabs.Screen name="more" />
      <Tabs.Screen name="points" options={{ href: null }} />
      <Tabs.Screen name="news" options={{ href: null }} />
    </Tabs>
  );
}
