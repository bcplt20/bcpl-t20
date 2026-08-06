const fs = require('fs');
const file = 'artifacts/bcpl-mobile/app/pages/[slug].tsx';
let content = fs.readFileSync(file, 'utf8');

// Insert sharedAnim to NativePageScreen
content = content.replace("  const bottomNavHeight = useBottomNavHeight();", `  const bottomNavHeight = useBottomNavHeight();
  
  const sharedShimmer = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sharedShimmer, { toValue: 1, duration: 4000, useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, [sharedShimmer]);`);

// Pass sharedAnim down
content = content.replace(/<AmbientShimmerBorder/g, `<AmbientShimmerBorder sharedAnim={sharedShimmer}`);

// Fix li block to no longer use AmbientPulse since it's deleted
content = content.replace(/<AmbientPulse.*?>\s*<View style=\{\{ width: 6, height: 6, borderRadius: 3, backgroundColor: c\.cyan \}\} \/>\s*<\/AmbientPulse>/s, `<View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.cyan }} />`);

fs.writeFileSync(file, content);
