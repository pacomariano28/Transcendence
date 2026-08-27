import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/10">
      <div className="container-page py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-zinc-500">
          <span>© {new Date().getFullYear()} Songuess</span>

          <span className="text-zinc-600">•</span>

          <Link to="/privacy" className="link">
            {t("privacy.title")}
          </Link>

          <span className="text-zinc-600">•</span>

          <Link to="/terms" className="link">
            {t("terms.title")}
          </Link>

          <span className="text-zinc-600">•</span>

          <span className="text-zinc-600">{t("footer.game_description")}</span>

          <span className="text-zinc-600">•</span>

          <span className="text-zinc-600">{t("footer.built_with")}</span>
        </div>
      </div>
    </footer>
  );
}
