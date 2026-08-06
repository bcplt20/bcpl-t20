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
  const page = NATIVE_PAGES[slug];
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  if (!page) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenBackground />
        <GlassAppBar title="Not Found" />
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
    
    // Fee table heuristic
    if (block.type === 'heading' && (block.text === 'Batsman / Bowler / WK' || block.text === 'All-Rounder')) {
      const nextBlock = page.content[i + 1];
      if (nextBlock && nextBlock.type === 'heading' && nextBlock.text.includes('₹')) {
        currentSection.blocks.push({ type: 'fee-row', label: block, value: nextBlock });
        i++; // skip next
        continue;
      }
    }
    
    if (block.type === 'heading') {
      if (currentSection.title || currentSection.blocks.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: block.hi ? t(block.text, block.hi) : block.text, blocks: [] };
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
      <GlassAppBar title={page.title} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: appBarHeight, paddingBottom: bottomNavHeight, gap: 16 }}>
        
        {/* Vibrant Hero Header */}
        <View style={{ marginBottom: 8, marginTop: 16 }}>
          <LinearGradient colors={['#FF3DA6', '#5B2BF0']} style={{ width: 48, height: 4, borderRadius: 2, marginBottom: 12 }} />
          <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 32, color: c.ink, letterSpacing: -1, lineHeight: 38 }}>
            {page.title}
          </Text>
        </View>

        {sections.map((sec, sIdx) => {
          if (isFaq && sec.title) {
            // FAQ renders as Accordions
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
                    if (block.type === 'fee-row') {
                      return (
                        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
                          <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 }}>
                            {block.label.hi ? t(block.label.text, block.label.hi) : block.label.text}
                          </Text>
                          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>
                            {block.value.hi ? t(block.value.text, block.value.hi) : block.value.text}
                          </Text>
                        </View>
                      );
                    }
                    
                    const txt = block.hi ? t(block.text, block.hi) : block.text;
                    
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
                  {sec.blocks.length === 0 && !sec.title && (
                    <Text style={[styles.p, { color: c.sub }]}>No content</Text>
                  )}
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
