import React, { memo } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { getNewsArticles } from '@/lib/api';
import { mergeNews, type MergedNews } from '@/lib/newsMerge';
import { Card, GradientTag } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useLang } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

const NewsCard = memo(({ n, onPress }: { n: MergedNews, onPress: () => void }) => {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, paddingHorizontal: 16, transform: [{ scale: pressed ? 0.98 : 1 }] })}
      testID={`news-${n.slug}`}
    >
      <Card border={true} padding={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
        {n.imageUri ? (
          <Image
            source={{ uri: n.imageUri }}
            style={{ width: '100%', height: 200 }}
            contentFit="cover"
            transition={150}
          />
        ) : null}
        <View pointerEvents="none" style={{position: 'absolute', top: 120, left: 0, right: 0, height: 80}}>
          <LinearGradient colors={['transparent', c.card]} style={StyleSheet.absoluteFill} />
        </View>
        <View style={{ padding: 20, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <GradientTag label={n.tag} color={c.magenta} />
            <Text style={{ color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{n.date}</Text>
          </View>
          <Text style={[styles.title, { color: c.ink }]} numberOfLines={3}>
            {n.title}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}, (prev, next) => prev.n.slug === next.n.slug);

export default function NewsScreen() {
  const c = useColors();
  const { t } = useLang();
  const router = useRouter();
  // Admin-published articles load on top of the static archive; if the API
  // hiccups the archive still renders.
  const apiQ = useQuery({ queryKey: ['news'], queryFn: getNewsArticles, staleTime: 5 * 60 * 1000, retry: false });
  const articles = mergeNews(apiQ.data?.articles);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={articles}
        keyExtractor={(n) => n.slug}
        ListHeaderComponent={<ScreenHeader title="News" subtitle={t('Latest league updates', 'लीग की ताज़ा खबरें')} back={true} />}
        scrollEnabled={articles.length > 0}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : 120, paddingTop: 10 }}
        windowSize={5}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        renderItem={({ item: n }) => (
          <NewsCard n={n} onPress={() => router.push(`/news/${n.slug}` as any)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontFamily: 'BricolageGrotesque_800ExtraBold', lineHeight: 28, letterSpacing: -0.5 },
});
