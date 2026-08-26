import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import translationEN from "./locales/en.json";
import translationES from "./locales/es.json";
import translationNL from "./locales/nl.json";
import translationRU from "./locales/ru.json";

const resources = {
  en: { translation: translationEN },
  es: { translation: translationES },
  nl: { translation: translationNL },
  ru: { translation: translationRU },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
