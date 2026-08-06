const fs = require('fs');

const file = 'artifacts/bcpl-mobile/app/pages/[slug].tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace standard Hero Header
const heroRegex = /\s*\{\/\* Vibrant Hero Header \*\/\}.*?<\/View>/s;
content = content.replace(heroRegex, `
        {/* Rich Hero Header */}
        <HeroMesh title={page.titleHi ? t(page.title, page.titleHi) : page.title} />
`);

// Add helper components at the top (after imports)
const helpers = `
function AmbientPulse({ children, style, min = 0.5, max = 1, duration = 2000 }: any) {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: false })
      ])
    ).start();
  }, [anim, duration]);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [min, max] });
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

function AmbientShimmerBorder({ children, style, colors, innerBg, borderRadius = 12 }: any) {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 4000, useNativeDriver: false })
    ).start();
  }, [anim]);
  const spin = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={[{ position: 'relative', overflow: 'hidden', borderRadius }, style]}>
      <Animated.View style={{ position: 'absolute', top: '-50%', left: '-50%', right: '-50%', bottom: '-50%', transform: [{ rotate: spin }] }}>
        <LinearGradient colors={colors} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View style={{ margin: 1, flex: 1, borderRadius: borderRadius - 1, backgroundColor: innerBg, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

function HeroMesh({ title }: { title: string }) {
  const c = useColors();
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 4000, useNativeDriver: false })
      ])
    ).start();
  }, [anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] });

  return (
    <View style={{ marginBottom: 16, marginTop: 4, position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: c.line, backgroundColor: c.card }}>
      <Image source={require('../../assets/images/bcpl-ball.png')} style={{ position: 'absolute', right: -60, top: -40, width: 220, height: 220, opacity: c.isDark ? 0.08 : 0.04, transform: [{ rotate: '-15deg' }] }} contentFit="contain" />
      <Animated.View style={{ position: 'absolute', top: -30, left: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: '#FF3DA6', opacity: c.isDark ? 0.2 : 0.1, transform: [{ translateY }, { scale }] }} />
      <Animated.View style={{ position: 'absolute', bottom: -40, right: 20, width: 180, height: 180, borderRadius: 90, backgroundColor: '#00E5FF', opacity: c.isDark ? 0.15 : 0.08, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, -10] }) }, { scale }] }} />
      <LinearGradient colors={['#FF3DA6', '#5B2BF0']} style={{ width: 48, height: 4, borderRadius: 2, marginBottom: 16 }} />
      <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 34, color: c.ink, letterSpacing: -1, lineHeight: 40 }}>
        {title}
      </Text>
    </View>
  );
}
`;
content = content.replace("export default function NativePageScreen() {", helpers + "\nexport default function NativePageScreen() {");

content = content.replace("import { AccordionItem", "import { Animated } from 'react-native';\nimport { Image } from 'expo-image';\nimport { AccordionItem");

fs.writeFileSync(file, content);
