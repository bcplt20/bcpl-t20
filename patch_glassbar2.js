const fs = require('fs');
const file = 'artifacts/bcpl-mobile/components/ui.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldBlock = `        ) : (
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

const newBlock = `        ) : (
          <View style={{ justifyContent: 'center', alignItems: 'flex-start', height: APP_BAR_CONTENT_HEIGHT }}>
            <Image
              source={c.isDark ? require('../assets/images/bcpl-logo-dark.png') : require('../assets/images/bcpl-logo-light.png')}
              style={[{ width: logoW, height: logoH }, !c.isDark && { transform: [{ scale: 1.18 }, { translateX: 6 }, { translateY: 2 }] }]} 
              contentFit="contain"
              contentPosition="left"
            />
            <View style={{ marginTop: 2 }}>
              <Season5Lockup />
            </View>
          </View>
        )}
      </View>
      {right || (!title && <HeaderCountdown />)}`;

content = content.replace(/        \) : \([\s\S]*?\{right \|\| \(\!title && <HeaderCountdown \/>\)\}/, newBlock);

fs.writeFileSync(file, content);
