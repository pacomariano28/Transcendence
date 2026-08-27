import { useTranslation } from "react-i18next";

type LeaveRoomButtonProps = {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  showTooltip?: boolean;
};

export default function LeaveRoomButton({
  onClick,
  className = "",
  showTooltip = true,
}: LeaveRoomButtonProps) {
  const { t } = useTranslation();

  return (
    <div className={`group relative flex items-center ${className}`.trim()}>
      <button
        type="button"
        onClick={onClick}
        aria-label={t("lobby.leaveRoom")}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/15 text-red-400 transition-colors duration-150 hover:bg-rose-500/10 hover:text-red-300"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="h-5 w-5"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      </button>
      {showTooltip ? (
        <span className="pointer-events-none absolute -top-8 right-[-12px] whitespace-nowrap rounded-md bg-zinc-950 px-2 py-1 font-mono text-[9px] sm:text-[10px] font-black tracking-widest text-red-400 opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
          {t("lobby.leaveRoom")}
        </span>
      ) : null}
    </div>
  );
}
