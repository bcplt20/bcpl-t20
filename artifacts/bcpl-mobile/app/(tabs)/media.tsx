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
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { WebView } from 'react-native-webview';
import { useColors } from '@/hooks/useColors';
import { useLang } from '@/context/LanguageContext';
import { getGallery, getVideos, type GalleryItem, type VideoItem } from '@/lib/api';
import { Card, ErrorView, LoadingView, GlassAppBar, ScreenBackground } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

const GAP = 12;
const COLS = 3;

export default function MediaScreen() {
  const c = useColors();
  const { t } = useLang();
  const [viewer, setViewer] = useState<GalleryItem | null>(null);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  // presigned viewUrls expire after ~1h — refetch periodically and on focus so links stay fresh
  const q = useQuery({
    queryKey: ['gallery'],
    queryFn: getGallery,
    staleTime: 5 * 60_000,
    refetchInterval: 30 * 60_000,
    refetchOnWindowFocus: true,
  });

  const vq = useQuery({
    queryKey: ['videos'],
    queryFn: getVideos,
    staleTime: 5 * 60_000,
  });

  const width = Dimensions.get('window').width;
  const cell = Math.floor((width - 32 - GAP * (COLS - 1)) / COLS);

  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

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
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.card2, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: c.line }}>
            <Feather name="camera" size={32} color={c.sub} />
          </View>
          <Text style={{ color: c.sub, fontSize: 15, textAlign: 'center', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
            {t('Season 5 photos & videos will appear here soon', 'सीज़न 5 की फ़ोटो और वीडियो जल्द यहाँ दिखेंगी')}
          </Text>
        </Card>
      ) : (
        q.data!.albums.map((album) => {
          const isOpen = expanded[album.id];
          const items = isOpen ? album.items : album.items.slice(0, 24);
          return (
          <View key={album.id} style={{ marginTop: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, letterSpacing: -0.3 }}>
                {album.name}
              </Text>
              <View style={{ backgroundColor: c.card2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: c.sub, fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {album.items.length} {t('Items', 'आइटम')}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => (item.kind === 'video' ? setActiveVideo({ id: item.id, title: 'Video', url: item.viewUrl }) : setViewer(item))}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}
                  testID={`media-${item.id}`}
                >
                  <View style={{ width: cell, height: cell, borderRadius: 16, overflow: 'hidden', backgroundColor: c.card2, borderWidth: 1, borderColor: c.line }}>
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
            {!isOpen && album.items.length > 24 ? (
              <Pressable
                onPress={() => setExpanded((e) => ({ ...e, [album.id]: true }))}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, marginTop: 12 })}
                testID={`media-viewall-${album.id}`}
              >
                <View style={{ borderRadius: 14, borderWidth: 1, borderColor: c.line, backgroundColor: c.card2, paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>
                    {t('View all', 'सभी देखें')} ({album.items.length})
                  </Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        );
        })
      )}

      {vq.data?.videos && vq.data.videos.length > 0 ? (
        <View style={{ marginTop: 40 }}>
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, marginBottom: 16 }}>
            {t('Videos', 'वीडियो')}
          </Text>
          {vq.data.videos.map((v) => (
            <Card key={v.id} padding={0} border={true} style={{ marginBottom: 16, overflow: 'hidden' }}>
              <Pressable
                onPress={() => setActiveVideo(v)}
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <View style={{ height: 180, backgroundColor: c.card2, alignItems: 'center', justifyContent: 'center' }}>
                  {v.youtubeId ? (
                    <Image source={{ uri: `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg` }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : null}
                  <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
                  <View style={styles.playCircle}>
                    <Feather name="play" size={24} color="#fff" style={{ marginLeft: 4 }} />
                  </View>
                </View>
                <View style={{ padding: 16 }}>
                  <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 }}>{v.title}</Text>
                </View>
              </Pressable>
            </Card>
          ))}
        </View>
      ) : null}

      <Modal visible={!!activeVideo} transparent animationType="fade" onRequestClose={() => setActiveVideo(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' }}>
          <Pressable style={{ position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, zIndex: 10, padding: 12 }} onPress={() => setActiveVideo(null)}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 }}>
              <Feather name="x" size={24} color="#fff" />
            </View>
          </Pressable>
          {activeVideo?.youtubeId ? (
            <WebView
              source={{ uri: `https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0` }}
              style={{ width: Dimensions.get('window').width, height: (Dimensions.get('window').width * 9) / 16 }}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
            />
          ) : activeVideo?.url ? (
             <WebView
              source={{ uri: activeVideo.url }}
              style={{ width: Dimensions.get('window').width, height: (Dimensions.get('window').width * 9) / 16 }}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
            />
          ) : null}
        </View>
      </Modal>

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
