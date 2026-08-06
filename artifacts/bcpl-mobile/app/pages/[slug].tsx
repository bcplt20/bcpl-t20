import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { NATIVE_PAGES } from '@/data/pages';
import { Card, EmptyView, GlassAppBar, ScreenBackground, useAppBarHeight, useBottomNavHeight } from '@/components/ui';
import { Animated } from 'react-native';
import { Image } from 'expo-image';
import { AccordionItem } from '@/components/MoreSections';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


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

export default function NativePageScreen() {
  const c = useColors();
  const { t } = useLang();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const page = NATIVE_PAGES[slug as string];
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();
  
  const sharedShimmer = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sharedShimmer, { toValue: 1, duration: 4000, useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, [sharedShimmer]);

  if (!page) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenBackground />
        <GlassAppBar title="Not Found" back={true} />
        <View style={{ flex: 1, paddingTop: appBarHeight }}>
          <EmptyView icon="file-text" text={t('Page not found', 'पेज नहीं मिला')} />
        </View>
      </View>
    );
  }

  const isFaq = slug === 'faq';

  const sections: { title: string | null; blocks: any[] }[] = [];
  let currentSection: { title: string | null; blocks: any[] } = { title: null, blocks: [] };
  
  for (let i = 0; i < page.content.length; i++) {
    const block = page.content[i];
    
    if (block.type === 'heading') {
      if (currentSection.title || currentSection.blocks.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: block.hi ? t(block.text || '', block.hi) : block.text || null, blocks: [] };
    } else {
      currentSection.blocks.push(block);
    }
  }
  if (currentSection.title || currentSection.blocks.length > 0) {
    sections.push(currentSection);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={page.titleHi ? t(page.title, page.titleHi) : page.title} back={true} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomNavHeight, gap: 16 }}>
        <View style={{ height: appBarHeight - 16 }} />
        {/* Rich Hero Header */}
        <HeroMesh title={page.titleHi ? t(page.title, page.titleHi) : page.title} />


        {sections.map((sec, sIdx) => {
          if (isFaq) {
            return (
              <View key={sIdx} style={{ gap: 8 }}>
                {sec.title && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: sIdx === 0 ? 0 : 12, marginBottom: 4 }}>
                    <LinearGradient colors={['#FF3DA6', '#5B2BF0']} style={{ width: 20, height: 3, borderRadius: 2 }} />
                    <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 13, letterSpacing: 1, color: c.magenta, textTransform: 'uppercase' }}>
                      {sec.title}
                    </Text>
                  </View>
                )}
                {sec.blocks.map((b, bi) => (
                  <AccordionItem
                    key={bi}
                    title={b.hi ? t(b.text, b.hi) : b.text}
                    body={b.answer?.hi ? t(b.answer.text, b.answer.hi) : (b.answer?.text || '')}
                  />
                ))}
              </View>
            );
          }

          if (!sec.title && sec.blocks.length === 0) return null;

          return (
            <Card key={sIdx} padding={0} border={true} style={{ overflow: 'hidden' }}>
              <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: sIdx % 2 === 0 ? c.cyan : c.magenta }} />
              
              <View style={{ padding: 20, paddingLeft: 24 }}>
                {sec.title && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 12, marginBottom: 16 }}>
                    <LinearGradient colors={['#FF3DA6', '#5B2BF0']} style={{ width: 4, height: '100%', borderRadius: 2 }} />
                    <Text style={[styles.heading, { color: c.ink, marginBottom: 0 }]}>
                      {sec.title}
                    </Text>
                  </View>
                )}
                
                <View>
                  {sec.blocks.map((block, i) => {
                    const txt = block.hi ? t(block.text, block.hi) : block.text;
                    
                    if (block.type === 'stats') {
                      return (
                        <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                          {block.items?.map((item: any, idx: number) => (
                            <AmbientShimmerBorder sharedAnim={sharedShimmer} key={idx} style={{ flex: 1 }} colors={[item.color, c.card2, item.color]} innerBg={c.card2} borderRadius={12}>
                              <View style={{ padding: 12, alignItems: 'center' }}>
                                <Text style={{ color: item.color, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: item.v.length > 6 ? 13 : 18, marginBottom: 4 }} numberOfLines={1} adjustsFontSizeToFit>{item.v}</Text>
                                <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, textAlign: 'center' }}>{item.l}</Text>
                              </View>
                            </AmbientShimmerBorder>
                          ))}
                        </View>
                      );
                    }
                    
                    if (block.type === 'callout') {
                      const tone = block.icon || 'info';
                      const toneMap: Record<string, { bg: string; bd: string; fg: string; icon: any }> = {
                        info: { bg: c.isDark ? 'rgba(0,220,245,0.08)' : 'rgba(0,151,167,0.06)', bd: c.isDark ? 'rgba(0,220,245,0.20)' : 'rgba(0,151,167,0.20)', fg: c.isDark ? c.cyan : '#0097A7', icon: 'info' },
                        success: { bg: 'rgba(22,224,163,0.08)', bd: 'rgba(22,224,163,0.20)', fg: c.mint, icon: 'check-circle' },
                        warn: { bg: 'rgba(255,90,110,0.08)', bd: 'rgba(255,90,110,0.20)', fg: c.coral, icon: 'alert-triangle' },
                        gold: { bg: 'rgba(255,197,61,0.08)', bd: 'rgba(255,197,61,0.20)', fg: c.amber, icon: 'star' },
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

                    if (block.type === 'ticks') {
                      const neg = block.icon === 'x';
                      const dotColor = neg ? c.coral : c.mint;
                      const dotBg = neg ? 'rgba(255,90,110,0.12)' : 'rgba(22,224,163,0.14)';
                      return (
                        <View key={i} style={{ marginBottom: 12 }}>
                          {block.items?.map((item: any, idx: number) => (
                            <View key={idx} style={[styles.li, { alignItems: 'center' }]}>
                              <View style={{ marginRight: 12, width: 22, height: 22, borderRadius: 11, backgroundColor: dotBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${dotColor}33` }}>
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
                    
                    if (block.type === 'li') {
                      return (
                        <View key={i} style={[styles.li]}>
                          <View style={{ marginTop: 4, marginRight: 12, width: 16, height: 16, borderRadius: 8, backgroundColor: c.isDark ? 'rgba(0,229,255,0.1)' : 'rgba(0,151,167,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.cyan }} />
                          </View>
                          <Text style={[styles.p, { color: c.sub, marginBottom: 0 }]}>{txt}</Text>
                        </View>
                      );
                    }
                    
                    return (
                      <Text key={i} style={[styles.p, { color: c.sub }]}>
                        {txt}
                      </Text>
                    );
                  })}</View>
              </View>
            </Card>
          );
        })}
        
        {/* WEBSITE CTA FOOTER */}
        <Pressable 
          onPress={() => WebBrowser.openBrowserAsync('https://bcplt20.com')}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
        >
          <LinearGradient 
            colors={c.isDark ? ['#161124', '#0B0813'] : ['#F4F0FF', '#FFFFFF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ 
              borderRadius: 16, padding: 20, marginTop: 12, marginBottom: 12,
              borderWidth: 1, borderColor: c.isDark ? '#2D234A' : '#E8E2FF',
              flexDirection: 'row', alignItems: 'center', gap: 16,
              shadowColor: c.magenta, shadowOpacity: c.isDark ? 0.1 : 0.05, shadowRadius: 10, shadowOffset: {width: 0, height: 4}, elevation: 3
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.isDark ? 'rgba(0, 229, 255, 0.1)' : 'rgba(0, 151, 167, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="globe" size={20} color={c.cyan} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, color: c.sub, marginBottom: 2 }}>
                {t('For more information, visit our website', 'और अधिक जानकारी के लिए हमारी website पर जाएँ')}
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 16, color: c.ink }}>
                www.bcplt20.com
              </Text>
            </View>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.card2, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="arrow-right" size={16} color={c.magenta} />
            </View>
          </LinearGradient>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 20,
    marginBottom: 12,
  },
  p: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
    flex: 1,
  },
  li: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
});