import { useTranslation } from "react-i18next";
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "../i18n/languages";

type LanguagePickerGridProps = {
  onLanguageChange?: () => void;
};

export function LanguagePickerGrid({ onLanguageChange }: LanguagePickerGridProps) {
  const { t, i18n } = useTranslation();
  const currentLangBase = (i18n.language || "en").split("-")[0];

  function changeLanguage(lang: SupportedLanguage) {
    i18n.changeLanguage(lang);
    onLanguageChange?.();
  }

  return (
    <div className="px-1">
      <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">
        {t("header.change_lang")}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = currentLangBase === lang;

          return (
            <button
              key={lang}
              type="button"
              role="menuitemradio"
              aria-checked={isActive}
              className={[
                "rounded-xl border px-2.5 py-2 text-xs font-medium uppercase tracking-wider transition-all duration-200 active:scale-[0.98]",
                isActive
                  ? "border-[#f7d046]/40 bg-[#f7d046]/10 text-[#f7d046] shadow-[0_0_12px_rgba(247,208,70,0.12)]"
                  : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
              ].join(" ")}
              onClick={() => changeLanguage(lang)}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
