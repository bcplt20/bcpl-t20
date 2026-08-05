import React from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { SITE_ASSETS } from '@/lib/api';
import { NEWS_ARTICLES } from '@/data/news';
import { Card } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useLang } from '@/context/LanguageContext';

export default function NewsScreen() {
  const c = useColors();
  const { t } = useLang();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <FlatList
        data={NEWS_ARTICLES}
        keyExtractor={(n) => n.slug}
        ListHeaderComponent={<ScreenHeader title="News" subtitle={t('Latest league updates', 'लीग की ताज़ा खबरें')} />}
        scrollEnabled={NEWS_ARTICLES.length > 0}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : 100 }}
        renderItem={({ item: n }) => (
          <Pressable
            onPress={() => router.push(`/news/${n.slug}`)}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, paddingHorizontal: 16, transform: [{ scale: pressed ? 0.98 : 1 }] })}
            testID={`news-${n.slug}`}
          >
            <Card style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
              <Image
                source={{ uri: `${SITE_ASSETS}/bcpl-assets/news/${n.image}` }}
                style={{ width: '100%', height: 200 }}
                contentFit="cover"
                transition={150}
              />
              <View style={{ padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text style={{ color: c.accent, fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
                    {n.tag.toUpperCase()}
                  </Text>
                  <Text style={{ color: c.mutedForeground, fontSize: 12 }}>• {n.date}</Text>
                </View>
                <Text style={[styles.title, { color: c.foreground }]} numberOfLines={3}>
                  {n.title}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', lineHeight: 24, letterSpacing: -0.2 },
});
