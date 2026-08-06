import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { getGallery, type GalleryItem } from '@/lib/api';
import { Card, ErrorView, LoadingView, GlassAppBar, ScreenBackground } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

const GAP = 12;
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
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title="Photos & Videos" />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 118 : 120, paddingTop: 100 }}
      >
      <Text style={{ color: '#00E5FF', fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 11, letterSpacing: 2 }}>
        {t('GALLERY', 'गैलरी')}
      </Text>
      <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 26, marginTop: 6 }}>
        {t('Photos & Videos', 'फ़ोटो और वीडियो')}
      </Text>

      {q.isLoading ? (
        <LoadingView />
      ) : q.isError ? (
        <ErrorView onRetry={() => q.refetch()} />
      ) : (q.data?.albums?.length ?? 0) === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 48, marginTop: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' }}>
            <Feather name="camera" size={32} color={c.sub} />
          </View>
          <Text style={{ color: c.sub, fontSize: 15, textAlign: 'center', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
            {t('Season 5 photos & videos will appear here soon', 'सीज़न 5 की फ़ोटो और वीडियो जल्द यहाँ दिखेंगी')}
          </Text>
        </Card>
      ) : (
        q.data!.albums.map((album) => (
          <View key={album.id} style={{ marginTop: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, letterSpacing: -0.3 }}>
                {album.name}
              </Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {album.items.length} {t('Items', 'आइटम')}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
              {album.items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => (item.kind === 'video' ? WebBrowser.openBrowserAsync(item.viewUrl) : setViewer(item))}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}
                  testID={`media-${item.id}`}
                >
                  <View style={{ width: cell, height: cell, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    {item.kind === 'photo' ? (
                      <Image source={{ uri: item.viewUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                    ) : (
                      <View style={{ flex: 1 }}>
                        <Image source={{ uri: item.viewUrl }} style={[StyleSheet.absoluteFill, { opacity: 0.5 }]} contentFit="cover" blurRadius={10} />
                        <LinearGradient
                          colors={['rgba(11,8,19,0.6)', 'rgba(22,17,36,0.4)']}
                          style={StyleSheet.absoluteFill}
                        />
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <View style={styles.playCircle}>
                            <Feather name="play" size={20} color="#fff" style={{ marginLeft: 3 }} />
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
        onPress={() => WebBrowser.openBrowserAsync('https://bcplt20.com/videos')}
        style={({ pressed }) => [styles.videosBtn, { borderColor: 'rgba(0, 229, 255, 0.3)', opacity: pressed ? 0.8 : 1 }]}
        testID="videos-link"
      >
        <Feather name="film" size={18} color="#00E5FF" />
        <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14.5, flex: 1 }}>
          {t('Season 4 auction videos & highlights', 'सीज़न 4 ऑक्शन वीडियो और हाइलाइट्स')}
        </Text>
        <Feather name="external-link" size={16} color={c.sub} />
      </Pressable>

      {/* full-screen photo viewer */}
      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <Pressable style={styles.viewerWrap} onPress={() => setViewer(null)}>
          {viewer ? (
            <Image source={{ uri: viewer.viewUrl }} style={{ width: '100%', height: '80%' }} contentFit="contain" />
          ) : null}
          <View style={styles.viewerClose}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 24 }}>
              <Feather name="x" size={24} color="#fff" />
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  playCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,26,117,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF1A75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  videosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginTop: 32,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  viewerWrap: {
    flex: 1,
    backgroundColor: 'rgba(11,8,19,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerClose: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20 },
});
