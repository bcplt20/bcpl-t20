import React from 'react';
import { Platform, StyleSheet, View, Pressable, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLang } from '@/context/LanguageContext';

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
            return (
              <View key={route.key} style={{ width: 84, height: barHeight, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 }}>
                <Pressable
                  onPress={() => router.push('/register')}
                  style={{
                    position: 'absolute',
                    top: -20,
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#FF3DA6',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.45,
                    shadowRadius: 10,
                    elevation: 6,
                  }}
                >
                  <LinearGradient
                    colors={['#5B2BF0', '#9B2FF0', '#FF3DA6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[{ borderRadius: 27 }, StyleSheet.absoluteFill]}
                  />
                  <Feather name="edit-3" size={20} color="#fff" />
                </Pressable>
                <Text style={{ color: c.magenta, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 10, letterSpacing: 0.3 }}>
                  {t('Register', 'रजिस्टर')}
                </Text>
              </View>
            );
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
