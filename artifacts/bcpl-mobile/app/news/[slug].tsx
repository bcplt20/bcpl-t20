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
import { LinearGradient } from 'expo-linear-gradient';

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
        <View>
          <Image
            source={{ uri: `${SITE_ASSETS}/bcpl-assets/news/${article.image}` }}
            style={{ width: '100%', height: 280 }}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={['transparent', c.background]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }}
          />
        </View>
        <View style={{ padding: 20, paddingTop: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Text style={{ color: c.accent, fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
              {article.tag.toUpperCase()}
            </Text>
            <Text style={{ color: c.mutedForeground, fontSize: 13 }}>• {article.date}</Text>
          </View>
          <Text style={[styles.title, { color: c.foreground }]}>{article.title}</Text>
          <View style={{ height: 3, width: 40, backgroundColor: c.primary, marginBottom: 20, borderRadius: 2 }} />
          
          {article.paragraphs.map((p, i) => (
            <Text key={i} style={[styles.para, { color: c.secondaryForeground }]}>
              {p}
            </Text>
          ))}

          {article.press.length > 0 ? (
            <Card style={{ marginTop: 24 }}>
              <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 10 }}>
                Press coverage
              </Text>
              {article.press.map((p) => (
                <Pressable
                  key={p.url}
                  onPress={() => Linking.openURL(p.url)}
                  style={({ pressed }) => [styles.pressRow, { opacity: pressed ? 0.7 : 1 }]}
                  testID={`press-${p.label}`}
                >
                  <View style={styles.pressIcon}>
                    <Feather name="external-link" size={14} color={c.accent} />
                  </View>
                  <Text style={{ color: c.accent, fontSize: 14, fontFamily: 'Inter_600SemiBold', flex: 1 }}>
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
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    lineHeight: 32,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  para: { 
    fontSize: 16, 
    lineHeight: 26, 
    marginBottom: 16,
    fontFamily: 'Inter_400Regular'
  },
  pressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  pressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(232, 178, 61, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
