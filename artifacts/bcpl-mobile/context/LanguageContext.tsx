import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Lang = 'en' | 'hi';
const STORAGE_KEY = 'bcpl_lang_v1';

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Pick the string for the active language. English is the default. */
  t: (en: string, hi: string) => string;
}

const Ctx = createContext<LanguageCtx>({ lang: 'en', setLang: () => {}, t: (en) => en });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'hi' || v === 'en') setLangState(v);
      })
      .catch(() => {});
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  };

  const t = (en: string, hi: string) => (lang === 'hi' ? hi : en);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}
