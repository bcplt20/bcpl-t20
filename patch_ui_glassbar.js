const fs = require('fs');
const file = 'artifacts/bcpl-mobile/components/ui.tsx';
let content = fs.readFileSync(file, 'utf8');

const glassBarRegex = /        \{\?title \? \([\s\S]*?\{right \|\| \(\!title && <HeaderCountdown \/>\)\}/;

const newGlassBarContent = `        {title ? (
          <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, color: c.ink, letterSpacing: -0.5 }} numberOfLines={1}>{title}</Text>
        ) : (
          <View style={{ justifyContent: 'center', alignItems: 'flex-start', height: APP_BAR_CONTENT_HEIGHT, paddingTop: 4 }}>
            <Image
              source={c.isDark ? require('../assets/images/bcpl-logo-dark.png') : require('../assets/images/bcpl-logo-light.png')}
              style={[{ width: 140, height: 32 }, !c.isDark && { transform: [{ scale: 1.15 }, { translateX: 8 }] }]} 
              contentFit="contain"
              contentPosition="left"
            />
            <View style={{ marginTop: 2, paddingLeft: !c.isDark ? 5 : 0 }}>
              <Season5Lockup />
            </View>
          </View>
        )}
      </View>
      {right || (!title && <HeaderCountdown />)}`;

content = content.replace(/        \{title \? \([\s\S]*?\{right \|\| \(\!title && <HeaderCountdown \/>\)\}/, newGlassBarContent);

fs.writeFileSync(file, content);
