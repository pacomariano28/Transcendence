/** Match code header with animated round indicator. */
import LeaveRoomButton from "../../components/LeaveRoomButton";

type MatchPageHeaderProps = {
  code: string;
  roundLabel: string;
  roundIndex: number | undefined;
  isMatchFinished: boolean;
  onLeaveMatch?: () => void;
};

export default function MatchPageHeader({
  code,
  roundLabel,
  roundIndex,
  isMatchFinished,
  onLeaveMatch,
}: MatchPageHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
          <h1 className="select-text font-mono text-3xl font-semibold tracking-[0.35em] text-zinc-500 hover:text-white transition duration-300 ease-in-out sm:text-5xl">
            {code || "———"}
          </h1>

          {!isMatchFinished && onLeaveMatch ? (
            <LeaveRoomButton onClick={() => onLeaveMatch()} />
          ) : null}
        </div>

        {!isMatchFinished && (
          <div
            key={roundIndex ?? "idle"}
            className="animate-round-change flex shrink-0 items-center gap-2 rounded-xl border border-[#f7d046]/30 bg-[#f7d046]/10 px-3 py-1.5 font-mono text-xs font-bold tracking-wider text-[#f7d046] shadow-[0_0_15px_rgba(247,208,70,0.05)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f7d046] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f7d046]"></span>
            </span>
            {roundLabel}
          </div>
        )}
      </div>
    </header>
  );
}
