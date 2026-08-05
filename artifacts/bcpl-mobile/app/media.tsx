import React, { useState } from 'react';
import {
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { getGallery, type GalleryItem } from '@/lib/api';
import { Card, ErrorView, LoadingView } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

const GAP = 8;
const COLS = 3;

export default function MediaScreen() {
  const c = useColors();
  const { t } = useLang();
  const [viewer, setViewer] = useState<GalleryItem | null>(null);

  // presigned viewUrls expire after ~1h — refetch periodically and on focus so links stay fresh
  const q = useQuery({
    queryKey: ['gallery'],
    queryFn: getGallery,
    staleTime: 5 * 60_000,
    refetchInterval: 30 * 60_000,
    refetchOnWindowFocus: true,
  });

  const width = Dimensions.get('window').width;
  const cell = Math.floor((width - 32 - GAP * (COLS - 1)) / COLS);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 60 : 40 }}
    >
      <Text style={{ color: '#E8B23D', fontFamily: 'Inter_700Bold', fontSize: 10.5, letterSpacing: 2 }}>
        {t('GALLERY', 'गैलरी')}
      </Text>
      <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: 3 }}>
        {t('Photos & Videos', 'फ़ोटो और वीडियो')}
      </Text>

      {q.isLoading ? (
        <LoadingView />
      ) : q.isError ? (
        <ErrorView onRetry={() => q.refetch()} />
      ) : (q.data?.albums?.length ?? 0) === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 36, marginTop: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Feather name="camera" size={24} color={c.mutedForeground} />
          </View>
          <Text style={{ color: c.mutedForeground, fontSize: 14, textAlign: 'center', fontFamily: 'Inter_500Medium' }}>
            {t('Season 5 photos & videos will appear here soon', 'सीज़न 5 की फ़ोटो और वीडियो जल्द यहाँ दिखेंगी')}
          </Text>
        </Card>
      ) : (
        q.data!.albums.map((album) => (
          <View key={album.id} style={{ marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: c.foreground, fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.3 }}>
                {album.name}
              </Text>
              <Text style={{ color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                {album.items.length} {t('Items', 'आइटम')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
              {album.items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => (item.kind === 'video' ? Linking.openURL(item.viewUrl) : setViewer(item))}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}
                  testID={`media-${item.id}`}
                >
                  <View style={{ width: cell, height: cell, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                    {item.kind === 'photo' ? (
                      <Image source={{ uri: item.viewUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                    ) : (
                      <View style={{ flex: 1 }}>
                        <LinearGradient
                          colors={['rgba(27,46,82,0.6)', 'rgba(36,57,107,0.3)']}
                          style={StyleSheet.absoluteFill}
                        />
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <View style={styles.playCircle}>
                            <Feather name="play" size={18} color="#fff" style={{ marginLeft: 2 }} />
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}

      {/* Season 4 videos live on the website */}
      <Pressable
        onPress={() => Linking.openURL('https://bcplt20.com/videos')}
        style={({ pressed }) => [styles.videosBtn, { borderColor: c.border, opacity: pressed ? 0.8 : 1 }]}
        testID="videos-link"
      >
        <Feather name="film" size={16} color="#FF6B00" />
        <Text style={{ color: c.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 13.5, flex: 1 }}>
          {t('Season 4 auction videos & highlights', 'सीज़न 4 ऑक्शन वीडियो और हाइलाइट्स')}
        </Text>
        <Feather name="external-link" size={15} color={c.mutedForeground} />
      </Pressable>

      {/* full-screen photo viewer */}
      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <Pressable style={styles.viewerWrap} onPress={() => setViewer(null)}>
          {viewer ? (
            <Image source={{ uri: viewer.viewUrl }} style={{ width: '100%', height: '80%' }} contentFit="contain" />
          ) : null}
          <View style={styles.viewerClose}>
            <Feather name="x" size={22} color="#fff" />
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  viewerWrap: {
    flex: 1,
    backgroundColor: 'rgba(4,10,24,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerClose: { position: 'absolute', top: 54, right: 20 },
});
