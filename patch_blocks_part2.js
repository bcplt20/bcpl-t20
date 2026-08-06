const fs = require('fs');

const file = 'artifacts/bcpl-mobile/app/pages/[slug].tsx';
let content = fs.readFileSync(file, 'utf8');

// replace stats block
const statsRegex = /if \(block\.type === 'stats'\) \{.*?return \([\s\S]*?<\/View>\s*\);\s*\}/;
content = content.replace(statsRegex, `
                    if (block.type === 'stats') {
                      return (
                        <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                          {block.items?.map((item: any, idx: number) => (
                            <AmbientShimmerBorder key={idx} style={{ flex: 1 }} colors={[item.color, c.card2, item.color]} innerBg={c.card2} borderRadius={12}>
                              <View style={{ padding: 12 }}>
                                <Text style={{ color: item.color, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 17, marginBottom: 4 }} numberOfLines={1} adjustsFontSizeToFit>{item.v}</Text>
                                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 }}>{item.l}</Text>
                              </View>
                            </AmbientShimmerBorder>
                          ))}
                        </View>
                      );
                    }
`);

// replace callout block
const calloutRegex = /if \(block\.type === 'callout'\) \{.*?return \([\s\S]*?<\/View>\s*\);\s*\}/;
content = content.replace(calloutRegex, `
                    if (block.type === 'callout') {
                      const tone = block.icon || 'info';
                      const toneMap: Record<string, { bg: string; bd: string; fg: string; icon: any }> = {
                        info: { bg: c.isDark ? 'rgba(0,220,245,0.10)' : 'rgba(0,151,167,0.10)', bd: c.isDark ? 'rgba(0,220,245,0.30)' : 'rgba(0,151,167,0.30)', fg: c.isDark ? c.cyan : '#0097A7', icon: 'info' },
                        success: { bg: 'rgba(22,224,163,0.10)', bd: 'rgba(22,224,163,0.35)', fg: c.mint, icon: 'check-circle' },
                        warn: { bg: 'rgba(255,90,110,0.10)', bd: 'rgba(255,90,110,0.35)', fg: c.coral, icon: 'alert-triangle' },
                        gold: { bg: 'rgba(255,197,61,0.10)', bd: 'rgba(255,197,61,0.35)', fg: c.amber, icon: 'star' },
                      };
                      const tn = toneMap[tone] || toneMap.info;
                      return (
                        <View key={i} style={{ backgroundColor: tn.bg, borderWidth: 1, borderColor: tn.bd, borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', gap: 16, overflow: 'hidden' }}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                             <LinearGradient colors={[tn.fg, 'transparent']} style={[StyleSheet.absoluteFill, { opacity: 0.2, borderRadius: 18 }]} />
                             <Feather name={tn.icon} size={20} color={tn.fg} />
                          </View>
                          <View style={{ flex: 1, justifyContent: 'center' }}>
                            {block.label?.text && (
                              <Text style={{ color: tn.fg, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 13, marginBottom: 6 }}>
                                {block.label.hi ? t(block.label.text, block.label.hi) : block.label.text}
                              </Text>
                            )}
                            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, lineHeight: 22 }}>
                              {txt}
                            </Text>
                          </View>
                        </View>
                      );
                    }
`);

// replace steps block
const stepsRegex = /if \(block\.type === 'steps'\) \{.*?return \([\s\S]*?<\/View>\s*\);\s*\}/;
content = content.replace(stepsRegex, `
                    if (block.type === 'steps') {
                      return (
                        <View key={i} style={{ marginTop: 8, marginBottom: 16 }}>
                          {block.items?.map((item: any, idx: number) => {
                            const isLast = idx === (block.items?.length || 0) - 1;
                            return (
                              <View key={idx} style={{ flexDirection: 'row', gap: 16, marginBottom: isLast ? 0 : 20, position: 'relative' }}>
                                {!isLast && (
                                  <View style={{ position: 'absolute', left: 15, top: 32, bottom: -20, width: 2, overflow: 'hidden', borderRadius: 1 }}>
                                    <LinearGradient colors={[c.cyan, c.magenta]} style={StyleSheet.absoluteFill} />
                                  </View>
                                )}
                                <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card2, borderWidth: 1, borderColor: c.line, shadowColor: c.cyan, shadowOpacity: c.isDark ? 0.3 : 0.1, shadowRadius: 4, elevation: 2 }}>
                                  <LinearGradient colors={[c.cyan, c.magenta]} style={[StyleSheet.absoluteFill, { opacity: 0.1, borderRadius: 16 }]} />
                                  <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14 }}>{idx + 1}</Text>
                                </View>
                                <View style={{ flex: 1, paddingTop: 4 }}>
                                  <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 21 }}>
                                    {t(item.en, item.hi)}
                                  </Text>
                                  {item.descEn && (
                                    <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, marginTop: 4 }}>
                                      {t(item.descEn, item.descHi)}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      );
                    }
`);

// replace ticks block
const ticksRegex = /if \(block\.type === 'ticks'\) \{.*?return \([\s\S]*?<\/View>\s*\);\s*\}/;
content = content.replace(ticksRegex, `
                    if (block.type === 'ticks') {
                      const neg = block.icon === 'x';
                      const dotColor = neg ? c.coral : c.mint;
                      const dotBg = neg ? 'rgba(255,90,110,0.12)' : 'rgba(22,224,163,0.14)';
                      return (
                        <View key={i} style={{ marginBottom: 12 }}>
                          {block.items?.map((item: any, idx: number) => (
                            <View key={idx} style={[styles.li, { alignItems: 'center' }]}>
                              <View style={{ marginRight: 12, width: 22, height: 22, borderRadius: 11, backgroundColor: dotBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: \`\${dotColor}33\` }}>
                                <Feather name={neg ? 'x' : 'check'} size={12} color={dotColor} />
                              </View>
                              <Text style={[styles.p, { color: c.sub, marginBottom: 0 }]}>
                                {item.hi ? t(item.en, item.hi) : item.en}
                              </Text>
                            </View>
                          ))}
                        </View>
                      );
                    }
`);

// replace table block
const tableRegex = /if \(block\.type === 'table'\) \{.*?return \([\s\S]*?<\/View>\s*\);\s*\}/;
content = content.replace(tableRegex, `
                    if (block.type === 'table') {
                      return (
                        <View key={i} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 16, overflow: 'hidden', marginBottom: 20, backgroundColor: c.card2 }}>
                          {block.rows?.map((row: any, idx: number) => {
                            const accent = row.color || (idx % 2 === 0 ? c.violet : c.magenta);
                            return (
                              <View key={idx} style={{ flexDirection: 'row', borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: c.line }}>
                                <View style={{ width: 100, borderRightWidth: 1, borderRightColor: c.line }}>
                                  <LinearGradient colors={[accent, 'transparent']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[StyleSheet.absoluteFill, { opacity: 0.1 }]} />
                                  <View style={{ padding: 14, flex: 1, justifyContent: 'center' }}>
                                    <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 12, letterSpacing: 0.5 }}>
                                      {row.k?.hi ? t(row.k.en, row.k.hi) : (row.k?.en || row.k)}
                                    </Text>
                                  </View>
                                </View>
                                <View style={{ flex: 1, padding: 14, justifyContent: 'center' }}>
                                  <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, lineHeight: 22 }}>
                                    {row.v?.hi ? t(row.v.en, row.v.hi) : (row.v?.en || row.v)}
                                  </Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      );
                    }
`);

// replace li block
const liRegex = /if \(block\.type === 'li'\) \{.*?return \([\s\S]*?<\/View>\s*\);\s*\}/;
content = content.replace(liRegex, `
                    if (block.type === 'li') {
                      return (
                        <View key={i} style={[styles.li]}>
                          <View style={{ marginTop: 4, marginRight: 12, width: 16, height: 16, borderRadius: 8, backgroundColor: c.isDark ? 'rgba(0,229,255,0.1)' : 'rgba(0,151,167,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                            <AmbientPulse min={0.4} max={1} duration={1500}>
                              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.cyan }} />
                            </AmbientPulse>
                          </View>
                          <Text style={[styles.p, { color: c.sub, marginBottom: 0 }]}>{txt}</Text>
                        </View>
                      );
                    }
`);

fs.writeFileSync(file, content);
