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
            style={{ width: '100%', height: 320 }}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={['transparent', c.background]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 }}
          />
        </View>
        <View style={{ padding: 20, paddingTop: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <View style={{ backgroundColor: '#FF6B00', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5 }}>
                {article.tag.toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: c.mutedForeground, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>{article.date}</Text>
          </View>
          <Text style={[styles.title, { color: c.foreground }]}>{article.title}</Text>
          <LinearGradient colors={['#FF6B00', '#E8B23D']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={{ height: 4, width: 60, marginBottom: 24, borderRadius: 2 }} />
          
          {article.paragraphs.map((p, i) => (
            <Text key={i} style={[styles.para, { color: c.secondaryForeground }]}>
              {p}
            </Text>
          ))}

          {article.press.length > 0 ? (
            <Card style={{ marginTop: 32 }}>
              <Text style={{ color: c.foreground, fontFamily: 'Inter_800ExtraBold', fontSize: 16, marginBottom: 16 }}>
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
                    <Feather name="external-link" size={16} color="#E8B23D" />
                  </View>
                  <Text style={{ color: c.accent, fontSize: 15, fontFamily: 'Inter_700Bold', flex: 1 }}>
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
    fontSize: 28,
    fontFamily: 'Inter_800ExtraBold',
    lineHeight: 36,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  para: { 
    fontSize: 16, 
    lineHeight: 28, 
    marginBottom: 20,
    fontFamily: 'Inter_500Medium'
  },
  pressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  pressIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(232, 178, 61, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
