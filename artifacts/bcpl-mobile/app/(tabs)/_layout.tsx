import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, Pressable, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, { Path, Rect, Circle, Defs, LinearGradient as SvgLinearGradient, RadialGradient as SvgRadialGradient, Stop, G, Ellipse } from 'react-native-svg';
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
        <G>
          <Path 
            d="M3 9.5L12 2l9 7.5V20a2 2 0 0 1-2 2h-4v-7a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v7H5a2 2 0 0 1-2-2V9.5z" 
            stroke={active ? `url(#${gradientId})` : color} 
            strokeWidth={active ? 2.5 : 2} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill={active ? `url(#${gradientId})` : 'none'} 
            fillOpacity={active ? 0.2 : 0} 
          />
          {active && (
            <Path d="M9 22v-5M15 22v-5M12 22v-5" stroke={`url(#${gradientId})`} strokeWidth="1.5" strokeLinecap="round" />
          )}
        </G>
      )}
      {name === 'matches' && (
        <G>
          <Rect x="3" y="5" width="18" height="17" rx="3" ry="3" 
            stroke={active ? `url(#${gradientId})` : color} 
            strokeWidth={active ? 2.5 : 2} 
            strokeLinecap="round" strokeLinejoin="round"
            fill={active ? `url(#${gradientId})` : 'none'} fillOpacity={active ? 0.15 : 0}
          />
          <Path d="M16 2v4M8 2v4M3 10h18" stroke={active ? `url(#${gradientId})` : color} strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" />
          {active && <Circle cx="12" cy="15.5" r="2.5" fill={`url(#${gradientId})`} />}
        </G>
      )}
      {name === 'media' && (
        <G>
          <Path 
            d="M 12 3 L 19.8 7.5 L 19.8 16.5 L 12 21 L 4.2 16.5 L 4.2 7.5 Z" 
            stroke={active ? `url(#${gradientId})` : color} 
            strokeWidth={active ? 2.5 : 2} 
            strokeLinecap="round" strokeLinejoin="round"
            fill={active ? `url(#${gradientId})` : 'none'} fillOpacity={active ? 0.15 : 0}
          />
          <Path d="M10 8.5l5.5 3.5-5.5 3.5v-7z" 
            stroke={active ? `url(#${gradientId})` : color} 
            strokeWidth={active ? 2.5 : 2} 
            strokeLinecap="round" strokeLinejoin="round"
            fill={active ? `url(#${gradientId})` : 'none'} 
          />
        </G>
      )}
      {name === 'more' && (
        <G>
          <Path d="M4 7h16M4 12h16M4 17h10" 
            stroke={active ? `url(#${gradientId})` : color} 
            strokeWidth={active ? 2.5 : 2} 
            strokeLinecap="round" strokeLinejoin="round"
          />
          {active && (
            <G fill={`url(#${gradientId})`}>
              <Circle cx="18" cy="17" r="2" />
            </G>
          )}
        </G>
      )}
    </Svg>
  );
}

const getSeamPathLeft = () => {
  let d = `M 27 0`;
  for(let i=1; i<=20; i++) {
    const t = i/20;
    const y = t * 54;
    const x = 27 - 12 * Math.sin(t * Math.PI);
    d += ` L ${x} ${y}`;
  }
  return d;
}

const getSeamPathRight = () => {
  let d = `M 27 0`;
  for(let i=1; i<=20; i++) {
    const t = i/20;
    const y = t * 54;
    const x = 27 + 12 * Math.sin(t * Math.PI);
    d += ` L ${x} ${y}`;
  }
  return d;
}

const generateStitches = () => {
  const elements = [];
  const ticks = 18;
  for (let i = 1; i < ticks; i++) {
    const t = i / ticks;
    const y = t * 54;
    const dx = 12 * Math.sin(t * Math.PI);
    const lx = 27 - dx;
    const rx = 27 + dx;
    
    const ddx = -12 * Math.PI * Math.cos(t * Math.PI);
    const ddy = 54;
    const mag = Math.sqrt(ddx*ddx + ddy*ddy);
    const nxL = ddy / mag;
    const nyL = -ddx / mag;
    
    const tickLen = 2.5;
    
    elements.push(
      <Path 
        key={`l-${i}`} 
        d={`M ${lx - nxL * tickLen} ${y - nyL * tickLen} L ${lx + nxL * tickLen} ${y + nyL * tickLen}`} 
        stroke="#FFD700" 
        strokeWidth="1.2" 
        strokeLinecap="round"
        opacity="0.85" 
      />
    );
    
    const ddxR = 12 * Math.PI * Math.cos(t * Math.PI);
    const magR = Math.sqrt(ddxR*ddxR + ddy*ddy);
    const nxR = ddy / magR;
    const nyR = -ddxR / magR;
    
    elements.push(
      <Path 
        key={`r-${i}`} 
        d={`M ${rx - nxR * tickLen} ${y - nyR * tickLen} L ${rx + nxR * tickLen} ${y + nyR * tickLen}`} 
        stroke="#FFD700" 
        strokeWidth="1.2" 
        strokeLinecap="round"
        opacity="0.85" 
      />
    );
  }
  return elements;
};

function RegisterFabButton({ onPress }: { onPress: () => void }) {
  const { t } = useLang();
  const c = useColors();
  const anim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1500, useNativeDriver: true })
      ])
    );
    pulse.start();
    
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    );
    rotate.start();

    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, [anim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

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
        <Svg width={60} height={16} viewBox="0 0 60 16" style={{ position: 'absolute', bottom: -4, zIndex: 0 }}>
          <Defs>
            <SvgRadialGradient id="pitchShadow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#E2C275" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#E2C275" stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>
          <Ellipse cx="30" cy="8" rx="30" ry="8" fill="url(#pitchShadow)" />
        </Svg>

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
          backgroundColor: '#160934',
          borderWidth: 1.5,
          borderColor: 'rgba(255, 61, 166, 0.8)',
          overflow: 'hidden',
          zIndex: 2
        }}>
          <Svg width={54} height={54} style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgRadialGradient id="ballGlow" cx="35%" cy="30%" r="65%">
                <Stop offset="0%" stopColor="#7C5CFF" stopOpacity="1" />
                <Stop offset="50%" stopColor="#2B125C" stopOpacity="1" />
                <Stop offset="100%" stopColor="#120524" stopOpacity="1" />
              </SvgRadialGradient>
            </Defs>
            <Circle cx="27" cy="27" r="27" fill="url(#ballGlow)" />
          </Svg>
          
          <Animated.View style={{ position: 'absolute', width: 54, height: 54, transform: [{ rotate: spin }] }}>
            <Svg width={54} height={54}>
              <Path d={getSeamPathLeft()} fill="none" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6" />
              <Path d={getSeamPathRight()} fill="none" stroke="#D4AF37" strokeWidth="0.8" opacity="0.6" />
              {generateStitches()}
            </Svg>
          </Animated.View>

          <Svg width={54} height={54} style={{ position: 'absolute', top: 0, left: 0 }}>
            <G transform="translate(17, 18)">
              <Rect x="3" y="0" width="6" height="1.5" rx="0.5" fill="#FFD700" />
              <Rect x="11" y="0" width="6" height="1.5" rx="0.5" fill="#FFD700" />
              <Rect x="3" y="3" width="2" height="14" rx="1" fill="#FFD700" />
              <Rect x="9" y="3" width="2" height="14" rx="1" fill="#FFD700" />
              <Rect x="15" y="3" width="2" height="14" rx="1" fill="#FFD700" />
            </G>
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
                route.name === 'matches' ? t('Matches', 'मैच') :
                route.name === 'media' ? t('Videos', 'वीडियो') :
                t('Menu', 'मेनू')
              }
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
