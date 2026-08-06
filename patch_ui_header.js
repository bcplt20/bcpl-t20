const fs = require('fs');
const file = 'artifacts/bcpl-mobile/components/ui.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Change APP_BAR_CONTENT_HEIGHT
content = content.replace(
  /export const APP_BAR_CONTENT_HEIGHT = \d+;/,
  'export const APP_BAR_CONTENT_HEIGHT = 72;'
);

// 2. Rewrite HeaderCountdown
const headerCountdownRegex = /function HeaderCountdown\(\) \{[\s\S]*?return \([\s\S]*?<\/View>\n  \);\n\}/;
const newHeaderCountdown = `function HeaderCountdown() {
  const c = useColors();
  const { t } = useLang();
  const [now, setNow] = React.useState(() => Date.now());
  const pulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => {
      clearInterval(id);
      loop.stop();
    };
  }, []);

  const left = REG_CLOSE_AT - now;
  if (left <= 0) return null;

  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <View style={{
      borderRadius: 10,
      padding: 1,
      shadowColor: '#9B2FF0',
      shadowOpacity: c.isDark ? 0.4 : 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
      backgroundColor: c.isDark ? '#2D196E' : '#E0D4FF',
      maxWidth: 100, // prevent wrapping issues on 320px
    }}>
      <LinearGradient 
        colors={['#7C5CFF', '#FF3DA6']} 
        start={{x: 0, y: 0}} end={{x: 1, y: 1}} 
        style={[StyleSheet.absoluteFill, { borderRadius: 10, opacity: c.isDark ? 0.6 : 0.8 }]} 
      />
      <View style={{
        backgroundColor: c.isDark ? '#0B0813' : '#FFFFFF',
        borderRadius: 9,
        paddingHorizontal: 8,
        paddingVertical: 5,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Animated.View style={{
            width: 4, height: 4, borderRadius: 2, backgroundColor: '#FF3DA6', marginRight: 4,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }]
          }} />
          <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, letterSpacing: 0.5, textTransform: 'uppercase' }} numberOfLines={1}>
            {t('Reg Closes In', 'रजिस्ट्रेशन बंद')}
          </Text>
        </View>
        <Text style={{ color: c.ink, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 13, fontVariant: ['tabular-nums'] }}>
          {d}d {pad(h)}:{pad(m)}:{pad(s)}
        </Text>
      </View>
    </View>
  );
}`;
content = content.replace(headerCountdownRegex, newHeaderCountdown);

// 3. Rewrite Season5Lockup
const lockupRegex = /export function Season5Lockup\(\) \{[\s\S]*?return \([\s\S]*?<\/View>\n  \);\n\}/;
const newLockup = `export function Season5Lockup() {
  const c = useColors();
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 3500,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const sweep = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: ['-100%', '200%', '200%']
  });

  return (
    <View style={{
      borderRadius: 6,
      overflow: 'hidden',
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: c.isDark ? '#2D196E' : '#2D196E', // Keep dark rich violet background
      borderWidth: 1,
      borderColor: '#B8860B', // Gold border
      shadowColor: '#EAC375',
      shadowOpacity: c.isDark ? 0.3 : 0.4,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 0 },
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    }}>
      <Text style={{
        fontFamily: 'BricolageGrotesque_800ExtraBold',
        fontSize: 10,
        color: '#EAC375', // Gold text
        letterSpacing: 1,
        zIndex: 3,
      }}>
        SEASON 5
      </Text>

      {/* Metallic Sheen Sweep */}
      <Animated.View style={{
        position: 'absolute',
        top: 0, bottom: 0, width: 25,
        left: sweep,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        transform: [{ skewX: '-25deg' }],
        zIndex: 2,
      }} />
    </View>
  );
}`;
content = content.replace(lockupRegex, newLockup);

fs.writeFileSync(file, content);
