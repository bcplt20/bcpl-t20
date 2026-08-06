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

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={page.title} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 100, paddingBottom: 60 }}>
        <Card padding={24} border={true}>
          {page.content.map((block, i) => {
            const txt = block.hi ? t(block.text, block.hi) : block.text;
            if (block.type === 'heading') {
              return (
                <Text key={i} style={[styles.heading, { color: c.ink, marginTop: i === 0 ? 0 : 24 }]}>
                  {txt}
                </Text>
              );
            }
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
        </Card>
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
