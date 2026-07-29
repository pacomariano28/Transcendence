export const SUPPORTED_LANGUAGES = ["en", "ru", "es", "nl"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  es: "Español",
  ru: "Русский",
  nl: "Nederlands",
};
