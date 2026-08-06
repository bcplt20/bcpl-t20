const fs = require('fs');
const file = 'artifacts/bcpl-mobile/app/(tabs)/_layout.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldTabBar = /function RegisterFabButton.*?export default function TabLayout/s;

const newTabBar = `function RegisterFabButton({ onPress }: { onPress: () => void }) {
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
      left: 16,
      right: 16,
      height: barHeight,
      borderRadius: 34,
      elevation: 10,
      shadowColor: c.isDark ? '#000' : '#2D196E',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: c.isDark ? 0.4 : 0.08,
      shadowRadius: 30,
    }}>
      <BlurView intensity={c.isDark ? 50 : 80} tint={c.isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: 34, overflow: 'hidden', borderWidth: 1, borderColor: c.line, backgroundColor: c.isDark ? 'rgba(11, 8, 19, 0.7)' : 'rgba(255, 255, 255, 0.8)' }]} />
      
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
                backgroundColor: isFocused ? (c.isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 151, 167, 0.1)') : 'transparent',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20
              }}>
                <Feather name={iconName} size={22} color={isFocused ? c.cyan : c.sub} style={isFocused && { opacity: 0.9 }} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout`;

content = content.replace(oldTabBar, newTabBar);
fs.writeFileSync(file, content);
