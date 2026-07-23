import React, { createContext, useContext, useState } from "react";

/**
 * Ultra-light EN/हिंदी language system.
 * - `useLang()` gives { lang, setLang, t } anywhere under <LangProvider>.
 * - `t(en, hi)` picks the string for the active language.
 * - Choice persists in localStorage ("bcpl_lang").
 *
 * Pages adopt it progressively — anything not wrapped in t() simply stays
 * in its current language. Default language is English.
 */

export type Lang = "en" | "hi";

type LangCtxType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string, hi: string) => string;
};

const LangCtx = createContext<LangCtxType>({
  lang: "en",
  setLang: () => {},
  t: (en) => en,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return localStorage.getItem("bcpl_lang") === "hi" ? "hi" : "en"; }
    catch { return "en"; }
  });
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("bcpl_lang", l); } catch { /* private mode */ }
  };
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
