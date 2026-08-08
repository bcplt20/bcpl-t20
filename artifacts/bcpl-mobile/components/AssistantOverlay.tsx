import React, { useRef, useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  Modal,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { aiChat, aiTranscribe, ApiError, type AiChatMsg } from '@/lib/api';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Bubble({ role, text, dim }: { role: 'user' | 'assistant'; text: string; dim?: boolean }) {
  const c = useColors();
  const user = role === 'user';
  return (
    <View style={{ alignSelf: user ? 'flex-end' : 'flex-start', maxWidth: '85%', marginBottom: 10, opacity: dim ? 0.7 : 1, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
      {!user && (
        <View style={{ width: 28, height: 28, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <LinearGradient colors={['#F7C24A', '#F5B63F', '#EE7A2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Ionicons name="sparkles" size={14} color="#1B2E52" />
        </View>
      )}
      <View style={{ flexShrink: 1, borderRadius: 18, borderBottomRightRadius: user ? 4 : 18, borderBottomLeftRadius: user ? 18 : 4, overflow: 'hidden' }}>
        {user ? (
          <LinearGradient colors={['#F7C24A', '#F5B63F', '#EE7A2E']} start={{x:0, y:0}} end={{x:1, y:1}} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ color: '#1B2E52', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14.5, lineHeight: 22 }}>{text}</Text>
          </LinearGradient>
        ) : (
          <View style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.line, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, borderBottomLeftRadius: 4 }}>
            <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14.5, lineHeight: 22 }}>{text}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function TypingIndicator() {
  const c = useColors();
  const d1 = useSharedValue(0.5);
  const d2 = useSharedValue(0.5);
  const d3 = useSharedValue(0.5);
  useEffect(() => {
    const anim = (v: any, delay: number) => { setTimeout(() => { v.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.5, { duration: 400 })), -1, true); }, delay); };
    anim(d1, 0); anim(d2, 200); anim(d3, 400);
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient colors={['#F7C24A', '#F5B63F', '#EE7A2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Ionicons name="sparkles" size={14} color="#1B2E52" />
      </View>
      <View style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.line, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18, borderBottomLeftRadius: 4, flexDirection: 'row', gap: 4, height: 42, alignItems: 'center' }}>
        <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F5B63F' }, useAnimatedStyle(() => ({ opacity: d1.value }))]} />
        <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F5B63F' }, useAnimatedStyle(() => ({ opacity: d2.value }))]} />
        <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F5B63F' }, useAnimatedStyle(() => ({ opacity: d3.value }))]} />
      </View>
    </View>
  );
}

const listeners = new Set<(isOpen: boolean) => void>();
export const useAssistantState = () => {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const cb = (state: boolean) => setIsOpen(state);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);
  return isOpen;
};

let overlayRef: any = null;

export const openAssistant = () => overlayRef?.open();
export const closeAssistant = () => overlayRef?.close();
export const toggleAssistant = () => overlayRef?.toggle();

export function AssistantOverlay() {
  const c = useColors();
  const { t, lang } = useLang();
  const { token, ready } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [isOpen, setIsOpen] = useState(false);
  const [msgs, setMsgs] = useState<AiChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recSecs, setRecSecs] = useState(0);
  
  useEffect(() => {
    overlayRef = {
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen(prev => !prev),
    };
    return () => { overlayRef = null; };
  }, []);

  useEffect(() => {
    listeners.forEach(cb => cb(isOpen));
  }, [isOpen]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setErr('');
    setInput('');
    const next: AiChatMsg[] = [...msgs, { role: 'user', text }];
    setMsgs(next);
    setBusy(true);
    try {
      const res = await aiChat(token || undefined, next.slice(-10));
      setMsgs([...next, { role: 'assistant', text: res.reply }]);
    } catch (e: any) {
      setErr(e instanceof ApiError ? e.message : 'Connection failed');
    } finally {
      setBusy(false);
    }
  };
  
  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setRecSecs(0);
      
      if (!uri) return;
      
      setBusy(true);
      setErr('');
      
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      await FileSystem.deleteAsync(uri, { idempotent: true });
      const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4';
      
      const res = await aiTranscribe(token || undefined, b64, mimeType);
      
      if (res.text) {
        setInput(prev => (prev ? prev + ' ' : '') + res.text);
      }
    } catch (e: any) {
      setErr(e instanceof ApiError ? e.message : 'Microphone error');
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        setErr(t('Microphone permission denied', 'माइक्रोफ़ोन की अनुमति नहीं दी गई'));
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: r } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(r);
      setRecSecs(0);
      setErr('');
    } catch (e: any) {
      setErr(e.message || 'Microphone error');
    }
  };
  
  const abortRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (e) {}
    setRecording(null);
    setRecSecs(0);
    setErr('');
  };

  useEffect(() => {
    if (!isOpen && recording) {
      abortRecording();
    }
  }, [isOpen, recording]);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  useEffect(() => {
    let int: any;
    if (recording) {
      int = setInterval(() => {
        setRecSecs(s => {
          if (s >= 59) {
            stopRecording();
            return 60;
          }
          return s + 1;
        });
      }, 1000);
    }
    return () => clearInterval(int);
  }, [recording]);

  const hello = token
    ? t(
        'Hi, I am your BCPL AI assistant! I can help you with your registration status, trial preparation, rules, or any questions about Season 5.',
        'नमस्ते, मैं आपका BCPL AI सहायक हूँ! मैं आपके रजिस्ट्रेशन स्टेटस, ट्रायल की तैयारी, नियमों या सीज़न 5 के बारे में किसी भी सवाल का जवाब दे सकता हूँ।'
      )
    : t(
        'Hi, I am your BCPL AI assistant! I can help you understand the selection process, fees, or rules. Log in to get personalised answers about your registration.',
        'नमस्ते, मैं आपका BCPL AI सहायक हूँ! मैं आपको चयन प्रक्रिया, फीस या नियम समझने में मदद कर सकता हूँ। अपने रजिस्ट्रेशन के बारे में जानकारी के लिए लॉग इन करें।'
      );

  const suggestions: Array<[string, string]> = token
    ? [
        ['Registration?', 'रजिस्ट्रेशन?'],
        ['Trial date?', 'ट्रायल डेट?'],
        ['KYC?', 'KYC कैसे करें?'],
        ['Points table?', 'पॉइंट्स टेबल?'],
        ['Rain rule?', 'बारिश का नियम (DLS)?'],
      ]
    : [
        ['Registration?', 'रजिस्ट्रेशन?'],
        ['Trial date?', 'ट्रायल डेट?'],
        ['KYC?', 'KYC कैसे करें?'],
        ['Points table?', 'पॉइंट्स टेबल?'],
        ['Rain rule?', 'बारिश का नियम (DLS)?'],
      ];

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={() => setIsOpen(false)}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {/* Header */}
        <LinearGradient colors={['rgba(247, 194, 74, 0.2)', 'transparent']} style={{ paddingTop: insets.top, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(247, 194, 74, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                  <LinearGradient colors={['#F7C24A', '#F5B63F', '#EE7A2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  <Ionicons name="sparkles" size={16} color="#1B2E52" />
                </View>
                <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20 }}>BCPL AI</Text>
              </View>
              <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, marginTop: 4 }}>BCPL T20 का अपना AI सहायक</Text>
            </View>
            <Pressable onPress={() => setIsOpen(false)} style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card2, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
              <Feather name="x" size={24} color={c.ink} />
            </Pressable>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={0}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            <Bubble role="assistant" text={hello} />
            {msgs.length === 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 8 }}>
                {suggestions.map(([en, hi]) => (
                  <Pressable
                    key={en}
                    onPress={() => setInput(lang === 'hi' ? hi : en)}
                    style={({ pressed }) => ({ backgroundColor: c.card2, borderWidth: 1, borderColor: '#F5B63F', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text style={{ color: c.getAccentText('#F5B63F'), fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12.5 }}>{t(en, hi)}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {msgs.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.text} />
            ))}
            {busy && <TypingIndicator />}
            {err ? (
              <Text style={{ color: '#FF7A9C', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, marginTop: 4, textAlign: 'center' }}>{err}</Text>
            ) : null}
          </ScrollView>

          {/* Input Area */}
          <View style={{ padding: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.bg }}>
            {recording ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: c.card2, borderRadius: 14, borderWidth: 1, borderColor: c.line }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.coral, marginRight: 12, shadowColor: c.coral, shadowRadius: 6, shadowOpacity: 0.8, elevation: 4 }} />
                <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, flex: 1 }}>
                  {t('Recording...', 'रिकॉर्डिंग कर रहा है...')} 0:{recSecs.toString().padStart(2, '0')}
                </Text>
                <Pressable onPress={stopRecording} style={({ pressed }) => ({ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: c.coral, borderRadius: 8, opacity: pressed ? 0.8 : 1 })}>
                  <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 }}>{t('Stop', 'रुकें')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8 }}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder={t('Ask anything...', 'कुछ भी पूछें...')}
                  placeholderTextColor={c.sub}
                  maxLength={1200}
                  onSubmitEditing={send}
                  returnKeyType="send"
                  style={{ flex: 1, borderRadius: 14, borderWidth: 1, borderColor: c.line, backgroundColor: c.card2, color: c.ink, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium' }}
                />
                <Pressable onPress={startRecording} disabled={busy} style={({ pressed }) => ({ width: 48, borderRadius: 14, backgroundColor: c.card2, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center', opacity: (pressed || busy) ? 0.7 : 1 })}>
                  <Feather name="mic" size={20} color={c.ink} />
                </Pressable>
                <Pressable onPress={send} disabled={busy || !input.trim()} style={{ borderRadius: 14, overflow: 'hidden', opacity: busy || !input.trim() ? 0.5 : 1 }}>
                  <LinearGradient colors={['#F7C24A', '#F5B63F', '#EE7A2E']} style={{ minWidth: 48, minHeight: 48, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="send" size={18} color="#1B2E52" />
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
