import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/10">
      <div className="container-page py-4">
        <div className="flex flex-col gap-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Songuess</span>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/privacy" className="link">
              {t("privacy.title")}
            </Link>
            <Link to="/terms" className="link">
              {t("terms.title")}
            </Link>
          </div>

          <span className="text-zinc-600">
            {t("footer.game_description")} • {t("footer.built_with")}
          </span>
        </div>
      </div>
    </footer>
  );
}
