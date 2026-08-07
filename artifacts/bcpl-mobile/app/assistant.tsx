import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';
import { aiChat, ApiError, type AiChatMsg } from '@/lib/api';
import {
  LoadingView,
  ScreenBackground,
  GlassAppBar,
  useAppBarHeight,
} from '@/components/ui';

/**
 * BCPL AI — official assistant chat, open to guests AND logged-in players.
 * Logged-in: answers grounded in the player's own journey status.
 * Guests: general answers (fees, journey, rules) — server prompts them to
 * log in for anything personal. Compliance-safe copy enforced server-side.
 */

function Bubble({ role, text, dim }: { role: 'user' | 'assistant'; text: string; dim?: boolean }) {
  const c = useColors();
  const user = role === 'user';
  return (
    <View
      style={{
        alignSelf: user ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        marginBottom: 10,
        opacity: dim ? 0.7 : 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      {!user && (
        <View style={{ width: 28, height: 28, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <LinearGradient colors={['#5B2BF0', '#00DCF5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Ionicons name="sparkles" size={14} color="#fff" />
        </View>
      )}
      <View
        style={{
          flexShrink: 1,
          borderRadius: 18,
          borderBottomRightRadius: user ? 4 : 18,
          borderBottomLeftRadius: user ? 18 : 4,
          overflow: 'hidden',
        }}
      >
        {user ? (
          <LinearGradient colors={['#5B2BF0', '#FF3DA6']} start={{x:0, y:0}} end={{x:1, y:1}} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14.5, lineHeight: 22 }}>{text}</Text>
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

  React.useEffect(() => {
    const anim = (v: any, delay: number) => {
      setTimeout(() => {
        v.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.5, { duration: 400 })), -1, true);
      }, delay);
    };
    anim(d1, 0);
    anim(d2, 200);
    anim(d3, 400);
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient colors={['#5B2BF0', '#00DCF5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Ionicons name="sparkles" size={14} color="#fff" />
      </View>
      <View style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.line, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18, borderBottomLeftRadius: 4, flexDirection: 'row', gap: 4, height: 42, alignItems: 'center' }}>
        <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.cyan }, useAnimatedStyle(() => ({ opacity: d1.value }))]} />
        <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.cyan }, useAnimatedStyle(() => ({ opacity: d2.value }))]} />
        <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.cyan }, useAnimatedStyle(() => ({ opacity: d3.value }))]} />
      </View>
    </View>
  );
}

export default function AssistantScreen() {
  const c = useColors();
  const { t, lang } = useLang();
  const { token, ready } = useAuth();
  const appBarHeight = useAppBarHeight();

  const [msgs, setMsgs] = useState<AiChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  if (!ready) return <LoadingView />;

  const Header = (
    <>
      <ScreenBackground />
      <GlassAppBar title="BCPL AI" back={true} />
    </>
  );

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setErr('');
    setInput('');
    const next: AiChatMsg[] = [...msgs, { role: 'user', text }];
    setMsgs(next);
    setBusy(true);
    try {
      const { reply } = await aiChat(token, next.slice(-10));
      setMsgs((m) => [...m, { role: 'assistant', text: reply }]);
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      setErr(
        status === 429
          ? t('Please wait a minute before sending more messages.', 'थोड़ी देर रुकें, फिर message भेजें।')
          : status === 503
            ? t('BCPL AI is not available right now.', 'BCPL AI अभी उपलब्ध नहीं है।')
            : t('Could not get an answer — try again.', 'जवाब नहीं मिल पाया — दोबारा try करें।'),
      );
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  const hello = token
    ? (lang === 'hi'
        ? 'नमस्ते! मैं BCPL AI हूँ। Payment, video, result, KYC या trial के बारे में कुछ भी पूछें।'
        : "Hi! I'm BCPL AI. Ask me anything about your payment, video, result, KYC or trial.")
    : (lang === 'hi'
        ? 'नमस्ते! मैं BCPL AI हूँ। BCPL, registration, fees या trials के बारे में कुछ भी पूछें। अपने payment/result के लिए पहले login करें।'
        : "Hi! I'm BCPL AI. Ask me anything about BCPL, registration, fees or trials. For your own payment/result, please log in first.");

  const suggestions: Array<[string, string]> = token
    ? [
        ['What is my current status?', 'मेरा अभी का status क्या है?'],
        ['When is my trial?', 'मेरा trial कब है?'],
        ['How do I upload my video?', 'Video कैसे upload करूँ?'],
        ['Winning prize?', 'कार किसे मिलेगी?'],
        ['Phase 1 fee?', 'Phase 1 की फ़ीस क्या है?'],
        ['Points system?', 'पॉइंट्स कैसे मिलते हैं?'],
      ]
    : [
        ['How do I register?', 'Registration कैसे करूँ?'],
        ['What is the entry fee?', 'Entry fee कितनी है?'],
        ['How do trials work?', 'Trials कैसे होते हैं?'],
        ['Winning prize?', 'कार किसे मिलेगी?'],
        ['Phase 1 fee?', 'Phase 1 की फ़ीस क्या है?'],
        ['Points system?', 'पॉइंट्स कैसे मिलते हैं?'],
      ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingTop: appBarHeight + 12, paddingBottom: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0, 220, 245, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Ionicons name="sparkles" size={32} color="#00DCF5" />
            </View>
            <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 24, textAlign: 'center' }}>
              BCPL AI
            </Text>
            <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
              {t('Powered by AI — answers 24/7', 'AI द्वारा संचालित — 24/7 जवाब')}
            </Text>
          </View>
          <Bubble role="assistant" text={hello} />
          {msgs.length === 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 8 }}>
              {suggestions.map(([en, hi]) => (
                <Pressable
                  key={en}
                  onPress={() => setInput(lang === 'hi' ? hi : en)}
                  style={{ backgroundColor: c.card2, borderWidth: 1, borderColor: c.cyan, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}
                >
                  <Text style={{ color: c.getAccentText(c.cyan), fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12.5 }}>{t(en, hi)}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {msgs.map((m, i) => (
            <Bubble key={i} role={m.role} text={m.text} />
          ))}
          {busy && <TypingIndicator />}
          {err ? (
            <Text style={{ color: '#FF7A9C', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12.5, marginTop: 4 }}>{err}</Text>
          ) : null}
        </ScrollView>

        <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.bg, flexGrow: 0, flexShrink: 0 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('Type your question…', 'अपना सवाल लिखें…')}
            placeholderTextColor={c.sub}
            maxLength={1200}
            onSubmitEditing={send}
            returnKeyType="send"
            style={{
              flex: 1,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: c.line,
              backgroundColor: c.card2,
              color: c.ink,
              paddingHorizontal: 14,
              paddingVertical: 11,
              fontSize: 14.5,
              fontFamily: 'PlusJakartaSans_500Medium',
            }}
          />
          <Pressable onPress={send} disabled={busy || !input.trim()} style={{ borderRadius: 14, overflow: 'hidden', opacity: busy || !input.trim() ? 0.5 : 1 }}>
            <LinearGradient colors={['#7C5CFF', '#FF3DA6']} style={{ paddingHorizontal: 16, minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="send" size={18} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
