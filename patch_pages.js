const fs = require('fs');
const file = 'artifacts/bcpl-mobile/app/pages/[slug].tsx';
let content = fs.readFileSync(file, 'utf8');

// Add corner accents to cards and watermarks
const cardStartRegex = /<Card key=\{sIdx\} padding=\{0\} border=\{true\} style=\{\{ overflow: 'hidden' \}\}>/g;
const newCardStart = `<Card key={sIdx} padding={0} border={true} style={{ overflow: 'hidden' }}>
              {/* Subtle watermark */}
              <Image source={require('../../assets/images/bcpl-ball.png')} style={{ position: 'absolute', right: -40, bottom: -40, width: 150, height: 150, opacity: c.isDark ? 0.03 : 0.02, transform: [{ rotate: '45deg' }] }} contentFit="contain" />
              {/* Corner accent */}
              <View style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, opacity: 0.1, overflow: 'hidden' }}>
                 <LinearGradient colors={[sIdx % 2 === 0 ? c.cyan : c.magenta, 'transparent']} start={{x:1, y:0}} end={{x:0, y:1}} style={StyleSheet.absoluteFill} />
              </View>
`;
content = content.replace(cardStartRegex, newCardStart);

fs.writeFileSync(file, content);
