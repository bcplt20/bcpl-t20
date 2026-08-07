import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
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
 * BCPL HELPER — AI assistant chat for logged-in players.
 * Answers grounded in the player's own journey status via POST /api/ai/chat.
 * Compliance-safe copy is enforced server-side; the client just renders.
 */

function Bubble({ role, text, dim }: { role: 'user' | 'assistant'; text: string; dim?: boolean }) {
  const c = useColors();
  const user = role === 'user';
  return (
    <View
      style={{
        alignSelf: user ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        borderRadius: 16,
        borderBottomRightRadius: user ? 4 : 16,
        borderBottomLeftRadius: user ? 16 : 4,
        overflow: 'hidden',
        marginBottom: 10,
        opacity: dim ? 0.7 : 1,
      }}
    >
      {user ? (
        <LinearGradient colors={['#7C5CFF', '#9D6BFF']} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
          <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, lineHeight: 21 }}>{text}</Text>
        </LinearGradient>
      ) : (
        <View style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.line, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderBottomLeftRadius: 4 }}>
          <Text style={{ color: c.ink, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, lineHeight: 21 }}>{text}</Text>
        </View>
      )}
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
      <GlassAppBar title={t('BCPL Helper', 'BCPL सहायक')} back={true} />
    </>
  );

  if (!token) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: appBarHeight }}>
          <Feather name="lock" size={28} color={c.magenta} />
          <Text style={{ color: c.ink, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
            {t('Log in to use the BCPL Helper', 'BCPL सहायक के लिए लॉगिन करें')}
          </Text>
        </View>
      </View>
    );
  }

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
            ? t('The helper is not available right now.', 'सहायक अभी उपलब्ध नहीं है।')
            : t('Could not get an answer — try again.', 'जवाब नहीं मिल पाया — दोबारा try करें।'),
      );
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  const hello =
    lang === 'hi'
      ? 'नमस्ते! मैं BCPL Helper हूँ। Payment, video, result, KYC या trial के बारे में कुछ भी पूछें।'
      : "Hi! I'm BCPL Helper. Ask me anything about your payment, video, result, KYC or trial.";

  const suggestions: Array<[string, string]> = [
    ['What is my current status?', 'मेरा अभी का status क्या है?'],
    ['When is my trial?', 'मेरा trial कब है?'],
    ['How do I upload my video?', 'Video कैसे upload करूँ?'],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>{Header}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, paddingTop: appBarHeight + 12, paddingBottom: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <Bubble role="assistant" text={hello} />
          {msgs.length === 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 8 }}>
              {suggestions.map(([en, hi]) => (
                <Pressable
                  key={en}
                  onPress={() => setInput(lang === 'hi' ? hi : en)}
                  style={{ backgroundColor: c.card2, borderWidth: 1, borderColor: c.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}
                >
                  <Text style={{ color: c.sub, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12.5 }}>{t(en, hi)}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {msgs.map((m, i) => (
            <Bubble key={i} role={m.role} text={m.text} />
          ))}
          {busy && <Bubble role="assistant" text={t('Typing…', 'लिख रहा है…')} dim />}
          {err ? (
            <Text style={{ color: '#FF7A9C', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12.5, marginTop: 4 }}>{err}</Text>
          ) : null}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.bg }}>
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
            <LinearGradient colors={['#7C5CFF', '#FF3DA6']} style={{ paddingHorizontal: 16, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="send" size={18} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
