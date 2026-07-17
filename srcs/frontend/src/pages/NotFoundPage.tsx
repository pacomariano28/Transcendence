import { useTranslation } from "react-i18next";
import TypingText from "../components/TypingText";

export default function NotFoundPage({ title }: { title?: string }) {
  const { t } = useTranslation();

  const displayTitle = title || t("errors.404_NOT_FOUND");

  return (
    <div className="container-page flex min-h-[calc(100dvh-9rem)] flex-col items-center justify-center text-center fade-in">
      <div className="mx-auto max-w-3xl">
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
          <TypingText text={displayTitle} size="lg" />
        </div>
      </div>
    </div>
  );
}
