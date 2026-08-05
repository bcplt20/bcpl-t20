import React from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { SITE_ASSETS } from '@/lib/api';
import { NEWS_ARTICLES } from '@/data/news';
import { Card, EmptyView } from '@/components/ui';

export default function NewsDetailScreen() {
  const c = useColors();
  const { t } = useLang();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const article = NEWS_ARTICLES.find((n) => n.slug === String(slug));

  if (!article) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <EmptyView icon="file-text" text={t('Article not found', 'लेख नहीं मिला')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 60 : 30 }}>
        <Image
          source={{ uri: `${SITE_ASSETS}/bcpl-assets/news/${article.image}` }}
          style={{ width: '100%', height: 220 }}
          contentFit="cover"
          transition={200}
        />
        <View style={{ padding: 16 }}>
          <Text style={{ color: c.accent, fontSize: 11.5, fontFamily: 'Inter_700Bold' }}>
            {article.tag.toUpperCase()} · {article.date}
          </Text>
          <Text style={[styles.title, { color: c.foreground }]}>{article.title}</Text>
          {article.paragraphs.map((p, i) => (
            <Text key={i} style={[styles.para, { color: c.secondaryForeground }]}>
              {p}
            </Text>
          ))}

          {article.press.length > 0 ? (
            <Card style={{ marginTop: 16 }}>
              <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 14, marginBottom: 6 }}>
                Press coverage
              </Text>
              {article.press.map((p) => (
                <Pressable
                  key={p.url}
                  onPress={() => Linking.openURL(p.url)}
                  style={({ pressed }) => [styles.pressRow, { opacity: pressed ? 0.7 : 1 }]}
                  testID={`press-${p.label}`}
                >
                  <Feather name="external-link" size={14} color={c.accent} />
                  <Text style={{ color: c.accent, fontSize: 13.5, fontFamily: 'Inter_600SemiBold' }}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    lineHeight: 27,
    marginTop: 6,
    marginBottom: 12,
  },
  para: { fontSize: 14.5, lineHeight: 23, marginBottom: 12 },
  pressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
  },
});
