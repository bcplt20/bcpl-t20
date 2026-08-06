const fs = require('fs');

const file = 'artifacts/bcpl-mobile/app/pages/[slug].tsx';
let content = fs.readFileSync(file, 'utf8');

// replace sec.title
const titleOld = `<View style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 12, marginBottom: 16 }}>
                    <Text style={[styles.heading, { color: c.ink, marginBottom: 0 }]}>
                      {sec.title}
                    </Text>
                  </View>`;
const titleNew = `<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 12, marginBottom: 16 }}>
                    <LinearGradient colors={['#FF3DA6', '#5B2BF0']} style={{ width: 4, height: '100%', borderRadius: 2 }} />
                    <Text style={[styles.heading, { color: c.ink, marginBottom: 0 }]}>
                      {sec.title}
                    </Text>
                  </View>`;
content = content.replace(titleOld, titleNew);

fs.writeFileSync(file, content);
