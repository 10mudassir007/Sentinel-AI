import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { AppLanguage, TranslationKey } from "../types";
import { translations } from "../translations";
import { loadSettings } from "../store/settings";

interface I18nContextValue {
  lang: AppLanguage;
  t: (key: TranslationKey) => string;
  setLanguage: (lang: AppLanguage) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<AppLanguage>("en");

  useEffect(() => {
    (async () => {
      const settings = await loadSettings();
      setLang(settings.language);
    })();
  }, []);

  const setLanguage = useCallback((newLang: AppLanguage) => {
    setLang(newLang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[lang]?.[key] ?? key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, t, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}