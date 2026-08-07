import React from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { getNewsArticles } from '@/lib/api';
import { mergeNews } from '@/lib/newsMerge';
import { Card, EmptyView, ScreenBackground, GlassAppBar, GradientTag, useAppBarHeight } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

export default function NewsDetailScreen() {
  const c = useColors();
  const { t, lang } = useLang();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const apiQ = useQuery({ queryKey: ['news'], queryFn: getNewsArticles, staleTime: 5 * 60 * 1000, retry: false });
  const article = mergeNews(apiQ.data?.articles).find((n) => n.slug === String(slug));
  const appBarHeight = useAppBarHeight();

  if (!article) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <EmptyView icon="file-text" text={t('Article not found', 'लेख नहीं मिला')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title="News" back={true} />
      <ScrollView contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 60 : 30, paddingTop: appBarHeight }}>
        {article.imageUri ? (
          <View>
            <Image
              source={{ uri: article.imageUri }}
              style={{ width: '100%', height: 320 }}
              contentFit="cover"
              transition={200}
            />
            <LinearGradient
              colors={['transparent', c.bg]}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 }}
            />
          </View>
        ) : null}
        <View style={{ padding: 20, paddingTop: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <GradientTag label={article.tag} color={c.magenta} />
            <Text style={{ color: c.sub, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{article.date}</Text>
          </View>
          <Text style={[styles.title, { color: c.ink }]}>{lang === 'hi' ? article.titleHi || article.title : article.title}</Text>

          {(lang === 'hi' && article.paragraphsHi?.length ? article.paragraphsHi : article.paragraphs).map((p, i) => (
            <Text key={i} style={[styles.para, { color: c.ink }]}>
              {p}
            </Text>
          ))}

          {article.press.length > 0 ? (
            <Card style={{ marginTop: 32 }} padding={0} border={true}>
              <View style={{ padding: 20, paddingBottom: 12 }}>
                <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>
                  Press coverage
                </Text>
              </View>
              {article.press.map((p, i) => (
                <Pressable
                  key={p.url}
                  onPress={() => Linking.openURL(p.url)}
                  style={({ pressed }) => [styles.pressRow, { opacity: pressed ? 0.7 : 1, paddingHorizontal: 20 }, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}
                  testID={`press-${p.label}`}
                >
                  <View style={[styles.pressIcon, { backgroundColor: `${c.cyan}20` }]}>
                    <Feather name="external-link" size={16} color={c.getAccentText(c.cyan)} />
                  </View>
                  <Text style={{ color: c.ink, fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', flex: 1 }}>
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
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    lineHeight: 36,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  para: { 
    fontSize: 16, 
    lineHeight: 28, 
    marginBottom: 20,
    fontFamily: 'PlusJakartaSans_500Medium'
  },
  pressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  pressIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
