const fs = require('fs');
const file = 'artifacts/bcpl-mobile/app/pages/[slug].tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove AmbientPulse, rewrite AmbientShimmerBorder to accept sharedAnim, and fix HeroMesh cleanup
const replacements1 = `
function AmbientShimmerBorder({ children, style, colors, innerBg, borderRadius = 12, sharedAnim }: any) {
  const spin = sharedAnim ? sharedAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) : '0deg';
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
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 4000, useNativeDriver: false })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] });

  return (
`;

// regex to replace from function AmbientPulse to return ( in HeroMesh
const rx1 = /function AmbientPulse.*?\n  return \(/s;
content = content.replace(rx1, replacements1.trim() + "\n  return (");

fs.writeFileSync(file, content);
