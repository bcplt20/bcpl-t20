import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { NATIVE_PAGES } from '@/data/pages';
import { Card, EmptyView, GlassAppBar, ScreenBackground } from '@/components/ui';

export default function NativePageScreen() {
  const c = useColors();
  const { t } = useLang();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const page = NATIVE_PAGES[slug];

  if (!page) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenBackground />
        <GlassAppBar title="Not Found" />
        <View style={{ flex: 1, paddingTop: 100 }}>
          <EmptyView icon="file-text" text={t('Page not found', 'पेज नहीं मिला')} />
        </View>
      </View>
    );
  }

  const sections: { title: string | null; blocks: any[] }[] = [];
  let currentSection: { title: string | null; blocks: any[] } = { title: null, blocks: [] };
  
  for (const block of page.content) {
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
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 100, paddingBottom: 60, gap: 16 }}>
        {sections.map((sec, sIdx) => (
          <Card key={sIdx} padding={20} border={true}>
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
                if (block.type === 'li') {
                  return (
                    <View key={i} style={styles.li}>
                      <Text style={[styles.bullet, { color: c.magenta }]}>•</Text>
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
          </Card>
        ))}
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
    marginBottom: 8,
  },
  bullet: {
    fontSize: 18,
    marginRight: 8,
    lineHeight: 24,
  },
});
