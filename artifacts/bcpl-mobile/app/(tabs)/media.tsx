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
import { getAppMedia, type AppMediaItem } from '@/lib/api';
import { Card, ErrorView, LoadingView, GlassAppBar, ScreenBackground, useAppBarHeight, useBottomNavHeight, SectionHeader } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

const GAP = 12;
const COLS = 3;

function getThumb(item: AppMediaItem): string | undefined {
  if (item.thumbUrl) return item.thumbUrl;
  if (item.youtubeId) return `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`;
  return undefined;
}

export default function MediaScreen() {
  const c = useColors();
  const { t } = useLang();
  
  const [photoViewer, setPhotoViewer] = useState<AppMediaItem | null>(null);
  const [videoViewer, setVideoViewer] = useState<AppMediaItem | null>(null);
  
  const appBarHeight = useAppBarHeight();
  const bottomNavHeight = useBottomNavHeight();

  const q = useQuery({
    queryKey: ['app-media'],
    queryFn: getAppMedia,
    staleTime: 5 * 60_000,
    refetchInterval: 30 * 60_000,
  });

  const width = Dimensions.get('window').width;
  const photoCellSize = Math.floor((width - 32 - GAP * (COLS - 1)) / COLS);
  
  const items = q.data?.items ?? [];
  const shorts = items.filter(x => x.kind === 'short').sort((a,b) => a.order - b.order);
  const videos = items.filter(x => x.kind === 'video').sort((a,b) => a.order - b.order);
  const photos = items.filter(x => x.kind === 'photo').sort((a,b) => a.order - b.order);

  const isEmpty = items.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBackground />
      <GlassAppBar title={t('Photos & Videos', 'फ़ोटो और वीडियो')} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomNavHeight, paddingTop: 0 }}
      >
        <View style={{ height: appBarHeight }} />
        {q.isLoading ? (
          <LoadingView />
        ) : q.isError ? (
          <ErrorView onRetry={() => q.refetch()} />
        ) : isEmpty ? (
          <Card style={{ alignItems: 'center', paddingVertical: 48, marginTop: 24 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.card2, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: c.line }}>
              <Feather name="camera" size={32} color={c.sub} />
            </View>
            <Text style={{ color: c.sub, fontSize: 15, textAlign: 'center', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
              {t('Season 5 photos and videos will appear here soon', 'सीज़न 5 की फ़ोटो और वीडियो जल्द यहाँ दिखेंगी')}
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 32, paddingTop: 16 }}>
            {/* SHORTS */}
            {shorts.length > 0 && (
              <View>
                <SectionHeader title={t('Shorts', 'शॉर्ट्स')} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {shorts.map(item => (
                    <Pressable
                      key={item.id}
                      onPress={() => setVideoViewer(item)}
                      style={({pressed}) => ({ opacity: pressed ? 0.8 : 1, width: 140, height: 248, borderRadius: 16, overflow: 'hidden', backgroundColor: c.card2, borderWidth: 1, borderColor: c.line })}
                    >
                      {getThumb(item) && <Image source={{ uri: getThumb(item) }} style={StyleSheet.absoluteFill} contentFit="cover" />}
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={[StyleSheet.absoluteFill, { top: '50%' }]} />
                      <View style={{ position: 'absolute', top: 12, right: 12 }}>
                        <View style={{ backgroundColor: 'rgba(255,26,117,0.9)', padding: 6, borderRadius: 12 }}>
                          <Feather name="play" size={14} color="#fff" />
                        </View>
                      </View>
                      <View style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                        <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 }} numberOfLines={2}>
                          {item.title || 'Short'}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* VIDEOS */}
            {videos.length > 0 && (
              <View>
                <SectionHeader title={t('Videos', 'वीडियो')} />
                <View style={{ gap: 16 }}>
                  {videos.map(item => (
                    <Pressable
                      key={item.id}
                      onPress={() => setVideoViewer(item)}
                      style={({pressed}) => ({ opacity: pressed ? 0.9 : 1, borderRadius: 16, overflow: 'hidden', backgroundColor: c.card2, borderWidth: 1, borderColor: c.line })}
                    >
                      <View style={{ width: '100%', aspectRatio: 16/9 }}>
                        {getThumb(item) && <Image source={{ uri: getThumb(item) }} style={StyleSheet.absoluteFill} contentFit="cover" />}
                        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                          <View style={styles.playCircle}>
                            <Feather name="play" size={24} color="#fff" style={{ marginLeft: 4 }} />
                          </View>
                        </View>
                      </View>
                      {item.title && (
                        <View style={{ padding: 16 }}>
                          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 16 }}>{item.title}</Text>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* PHOTOS */}
            {photos.length > 0 && (
              <View>
                <SectionHeader title={t('Photos', 'फ़ोटो')} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
                  {photos.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setPhotoViewer(item)}
                      style={({pressed}) => ({
                        width: photoCellSize,
                        height: photoCellSize,
                        borderRadius: 12,
                        backgroundColor: c.card2,
                        overflow: 'hidden',
                        opacity: pressed ? 0.7 : 1,
                        borderWidth: 1,
                        borderColor: c.line
                      })}
                    >
                      {(item.thumbUrl || item.viewUrl) && (
                        <Image
                          source={{ uri: item.thumbUrl || item.viewUrl }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* FULL-SCREEN PHOTO VIEWER */}
      <Modal visible={!!photoViewer} transparent animationType="fade" onRequestClose={() => setPhotoViewer(null)}>
        <Pressable style={styles.viewerWrap} onPress={() => setPhotoViewer(null)}>
          {photoViewer ? (
            <Image source={{ uri: photoViewer.viewUrl || photoViewer.url }} style={{ width: '100%', height: '80%' }} contentFit="contain" />
          ) : null}
          <View style={styles.viewerClose}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 24 }}>
              <Feather name="x" size={24} color="#fff" />
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* FULL-SCREEN VIDEO VIEWER */}
      <Modal visible={!!videoViewer} transparent animationType="slide" onRequestClose={() => setVideoViewer(null)}>
        <View style={styles.viewerWrap}>
          <Pressable style={[styles.viewerClose, { zIndex: 10 }]} onPress={() => setVideoViewer(null)}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 24 }}>
              <Feather name="x" size={24} color="#fff" />
            </View>
          </Pressable>
          
          <View style={{ width: '100%', aspectRatio: videoViewer?.kind === 'short' ? 9/16 : 16/9, backgroundColor: '#000' }}>
            {videoViewer?.youtubeId ? (
              <WebView 
                source={{ uri: `https://www.youtube.com/embed/${videoViewer.youtubeId}?autoplay=1&rel=0` }} 
                style={{ flex: 1 }} 
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
              />
            ) : videoViewer?.url ? (
               <WebView 
                 source={{ html: `
                    <style>body{margin:0;padding:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;} video{width:100%;height:100%;object-fit:contain;}</style>
                    <video src="${videoViewer.url}" controls autoplay playsinline></video>
                 ` }} 
                 style={{ flex: 1 }}
                 allowsInlineMediaPlayback
                 mediaPlaybackRequiresUserAction={false}
               />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff' }}>Video not available</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,26,117,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF1A75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  viewerWrap: {
    flex: 1,
    backgroundColor: 'rgba(11,8,19,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerClose: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20 },
});
