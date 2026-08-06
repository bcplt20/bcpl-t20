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
import { LinearGradient } from 'expo-linear-gradient';

export default function NewsScreen() {
  const c = useColors();
  const { t } = useLang();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={NEWS_ARTICLES}
        keyExtractor={(n) => n.slug}
        ListHeaderComponent={<ScreenHeader title="News" subtitle={t('Latest league updates', 'लीग की ताज़ा खबरें')} />}
        scrollEnabled={NEWS_ARTICLES.length > 0}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 118 : 120, paddingTop: 10 }}
        renderItem={({ item: n }) => (
          <Pressable
            onPress={() => router.push(`/news/${n.slug}`)}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, paddingHorizontal: 16, transform: [{ scale: pressed ? 0.97 : 1 }] })}
            testID={`news-${n.slug}`}
          >
            <Card style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
              <Image
                source={{ uri: `${SITE_ASSETS}/bcpl-assets/news/${n.image}` }}
                style={{ width: '100%', height: 200 }}
                contentFit="cover"
                transition={150}
              />
              <LinearGradient colors={['transparent', 'rgba(22, 17, 36,1)']} style={{position: 'absolute', top: 120, left: 0, right: 0, height: 80}} pointerEvents="none" />
              <View style={{ padding: 20, paddingTop: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <View style={{ backgroundColor: '#FF1A75', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'BricolageGrotesque_800ExtraBold', letterSpacing: 0.5 }}>
                      {n.tag.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{n.date}</Text>
                </View>
                <Text style={[styles.title, { color: c.ink }]} numberOfLines={3}>
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
  title: { fontSize: 20, fontFamily: 'BricolageGrotesque_800ExtraBold', lineHeight: 28, letterSpacing: -0.5 },
});
