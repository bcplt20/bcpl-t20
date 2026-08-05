import React from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { SITE_ASSETS } from '@/lib/api';
import { NEWS_ARTICLES } from '@/data/news';
import { Card } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function NewsScreen() {
  const c = useColors();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <FlatList
        data={NEWS_ARTICLES}
        keyExtractor={(n) => n.slug}
        ListHeaderComponent={<ScreenHeader title="News" subtitle="League की ताज़ा खबरें" />}
        scrollEnabled={NEWS_ARTICLES.length > 0}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : 100 }}
        renderItem={({ item: n }) => (
          <Pressable
            onPress={() => router.push(`/news/${n.slug}`)}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, paddingHorizontal: 16 })}
            testID={`news-${n.slug}`}
          >
            <Card style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
              <Image
                source={{ uri: `${SITE_ASSETS}/bcpl-assets/news/${n.image}` }}
                style={{ width: '100%', height: 170 }}
                contentFit="cover"
                transition={150}
              />
              <View style={{ padding: 14 }}>
                <Text style={{ color: c.accent, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                  {n.tag.toUpperCase()} · {n.date}
                </Text>
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
  title: { fontSize: 15.5, fontFamily: 'Inter_700Bold', marginTop: 5, lineHeight: 21 },
});
