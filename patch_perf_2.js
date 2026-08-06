const fs = require('fs');
const file = 'artifacts/bcpl-mobile/app/pages/[slug].tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace HeroMesh properly (my previous sed regex failed because it didn't match the newlines or I used the wrong one)
content = content.replace(/function HeroMesh\(\{ title \}: \{ title: string \}\) \{.*?\n  return \(/s, `function HeroMesh({ title }: { title: string }) {
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

  return (`);

content = content.replace(/function AmbientShimmerBorder.*?\n  return \(/s, `function AmbientShimmerBorder({ children, style, colors, innerBg, borderRadius = 12, sharedAnim }: any) {
  const spin = sharedAnim ? sharedAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) : '0deg';
  return (`);

content = content.replace(/function AmbientPulse.*?\n\}\n/s, "");

fs.writeFileSync(file, content);
