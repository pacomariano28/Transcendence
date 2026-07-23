import { useTranslation } from "react-i18next";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";

const SUPPORTED_LANGUAGES = ["en", "ru", "es", "nl"];

export default function LanguageButton() {
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language || "en";
  const currentLangBase = currentLang.split("-")[0];

  const toggleLanguage = (): void => {
    const currentIndex = SUPPORTED_LANGUAGES.indexOf(currentLangBase);
    const actualIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (actualIndex + 1) % SUPPORTED_LANGUAGES.length;

    i18n.changeLanguage(SUPPORTED_LANGUAGES[nextIndex]);
  };

  return (
    <button
      className="btn-glow btn-glow-no-bold px-4 text-sm font-medium h-9 flex items-center justify-center transition-all duration-200"
      style={
        { "--btn-color": "rgba(255, 255, 255, 0.15)" } as React.CSSProperties
      }
      onMouseMove={handleMouseMoveToSetFillOrigin}
      type="button"
      onClick={toggleLanguage}
      title={t("header.change_lang")}
    >
      <span className="text-zinc-200 uppercase font-mono tracking-wider text-xs">
        {currentLangBase}
      </span>
    </button>
  );
}
