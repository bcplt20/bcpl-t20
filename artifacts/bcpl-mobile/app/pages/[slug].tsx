import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { NATIVE_PAGES } from '@/data/pages';
import { Card, EmptyView, GlassAppBar, ScreenBackground, useAppBarHeight, useBottomNavHeight } from '@/components/ui';
import { AccordionItem } from '@/components/MoreSections';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function NativePageScreen() {
  const c = useColors();
  const { t } = useLang();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const page = NATIVE_PAGES[slug as string];
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

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
      <GlassAppBar title={page.title} back={true} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomNavHeight, gap: 16 }}>
        <View style={{ height: appBarHeight - 16 }} />
        
        {/* Vibrant Hero Header */}
        <View style={{ marginBottom: 8, marginTop: 16 }}>
          <LinearGradient colors={['#FF3DA6', '#5B2BF0']} style={{ width: 48, height: 4, borderRadius: 2, marginBottom: 12 }} />
          <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 32, color: c.ink, letterSpacing: -1, lineHeight: 38 }}>
            {page.title}
          </Text>
        </View>

        {sections.map((sec, sIdx) => {
          if (isFaq && sec.title) {
            return (
              <AccordionItem 
                key={sIdx} 
                title={sec.title} 
                body={sec.blocks.map(b => b.hi ? t(b.text, b.hi) : b.text).join('\n\n')} 
              />
            );
          }

          if (!sec.title && sec.blocks.length === 0) return null;

          return (
            <Card key={sIdx} padding={0} border={true} style={{ overflow: 'hidden' }}>
              <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: sIdx % 2 === 0 ? c.cyan : c.magenta }} />
              
              <View style={{ padding: 20, paddingLeft: 24 }}>
                {sec.title && (
                  <View style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 12, marginBottom: 16 }}>
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
                            <View key={idx} style={{ flex: 1, backgroundColor: c.card2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: item.color }}>
                              <Text style={{ color: item.color, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginBottom: 4 }}>{item.v}</Text>
                              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 }}>{item.l}</Text>
                            </View>
                          ))}
                        </View>
                      );
                    }
                    
                    if (block.type === 'callout') {
                      return (
                        <View key={i} style={{ backgroundColor: 'rgba(255, 122, 41, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 122, 41, 0.3)', borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', gap: 12 }}>
                          <Feather name="info" size={20} color="#FF7A29" />
                          <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, flex: 1, lineHeight: 22 }}>
                            {txt}
                          </Text>
                        </View>
                      );
                    }
                    
                    if (block.type === 'steps') {
                      return (
                        <View key={i} style={{ marginTop: 8 }}>
                          {block.items?.map((item: any, idx: number) => (
                            <View key={idx} style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.isDark ? '#2D196E' : '#E0D4FF', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: c.magenta, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 14 }}>{idx + 1}</Text>
                              </View>
                              <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 }}>
                                  {t(item.en, item.hi)}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    }
                    
                    if (block.type === 'li') {
                      return (
                        <View key={i} style={styles.li}>
                          <View style={{ marginTop: 2, marginRight: 10, width: 16, height: 16, borderRadius: 8, backgroundColor: c.isDark ? 'rgba(0,220,245,0.1)' : 'rgba(0,151,167,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                            <Feather name="check" size={10} color={c.cyan} />
                          </View>
                          <Text style={[styles.p, { color: c.sub }]}>{txt}</Text>
                        </View>
                      );
                    }
                    return (
                      <Text key={i} style={[styles.p, { color: c.sub }]}>
                        {txt}
                      </Text>
                    );
                  })}
                </View>
              </View>
            </Card>
          );
        })}
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