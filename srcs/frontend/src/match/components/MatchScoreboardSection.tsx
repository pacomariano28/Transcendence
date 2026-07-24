/** Live scoreboard during play; animated final results when the match ends. */
import { useTranslation } from "react-i18next";
import type { ScoreEntry } from "../../types/socket.payloads";
import { handleMouseMoveToSetFillOrigin } from "../../utils/buttonHover";
import type { ScoreboardEntry } from "../types";

type MatchScoreboardSectionProps = {
  isMatchFinished: boolean;
  resultsData: ScoreEntry[];
  myUserId: string | null;
  onLeaveFinishedMatch: () => void;
  onRequestRematch: () => void;
  rematchPending: boolean;
  scoreboard: ScoreboardEntry[];
  lockOwnerId: string | null;
  roundPhase: string;
};

export default function MatchScoreboardSection({
  isMatchFinished,
  resultsData,
  myUserId,
  onLeaveFinishedMatch,
  onRequestRematch,
  rematchPending,
  scoreboard,
  lockOwnerId,
  roundPhase,
}: MatchScoreboardSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      className={`card order-3 p-6 ${
        isMatchFinished
          ? "animate-match-results-enter mx-auto w-full max-w-2xl"
          : "lg:col-start-2 lg:row-start-1 lg:flex lg:h-[24rem] lg:flex-col lg:overflow-hidden"
      }`}
    >
      {isMatchFinished ? (
        <>
          <div className="animate-match-title-reveal">
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-[#f7d046]">
              {t("match.header.matchComplete")}
            </div>
            <div className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              {t("match.header.finalResults")}
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {resultsData.map((entry, index) => {
              const isWinner = index === 0;

              return (
                <div
                  key={entry.userId}
                  className={`animate-result-row-reveal flex min-h-[3.5rem] items-center justify-between rounded-2xl border px-4 py-3.5 sm:p-4 ${
                    isWinner
                      ? "animate-winner-glow border-[#f7d046]/50 bg-[#f7d046]/10"
                      : "border-white/10 bg-black/20"
                  }`}
                  style={{ animationDelay: `${250 + index * 100}ms` }}
                >
                  <div className="flex min-w-0 items-center gap-3 text-sm font-medium text-zinc-100 sm:text-base">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isWinner
                          ? "bg-[#f7d046] text-zinc-950"
                          : "bg-white/10 text-zinc-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate">{entry.displayName}</span>
                    {entry.userId === myUserId ? (
                      <span className="shrink-0 text-zinc-500 font-normal">
                        {t("match.header.you")}
                      </span>
                    ) : null}
                  </div>

                  <div
                    className={`shrink-0 text-lg font-semibold sm:text-xl ${
                      isWinner ? "text-[#f7d046]" : "text-white"
                    }`}
                  >
                    {entry.score}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="animate-match-back-reveal mt-8 flex gap-3 sm:flex-row">
            <button
              className="btn-glow flex-5 p-4"
              style={{ "--btn-color": "#4ade80" } as React.CSSProperties}
              type="button"
              onClick={onRequestRematch}
              disabled={rematchPending}
              onMouseMove={handleMouseMoveToSetFillOrigin}
            >
              <span>
                {rematchPending
                  ? t("match.header.rematchPending")
                  : t("match.header.playAgain")}
              </span>
            </button>
            <button
              className="btn-ghost flex-1"
              type="button"
              onClick={onLeaveFinishedMatch}
            >
              {t("match.header.backButton")}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="shrink-0 text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
            {t("match.scoreboard.title")}
          </div>
          {scoreboard.length === 0 ? (
            <div className="mt-4 flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
              {t("match.scoreboard.waitingForPlayers")}
            </div>
          ) : (
            <div className="mt-4 grid gap-2.5 lg:min-h-0 lg:flex-1 lg:grid-rows-5 lg:gap-2">
              {scoreboard.map((entry) => {
                const isCurrentLockOwner = entry.userId === lockOwnerId;
                const isWinRow =
                  roundPhase === "resolution-win" && isCurrentLockOwner;
                const isFailRow =
                  roundPhase === "resolution-fail" && isCurrentLockOwner;
                const isLockedRow =
                  roundPhase === "guessing" && isCurrentLockOwner;

                return (
                  <div
                    key={entry.userId}
                    className={`flex min-h-[3.25rem] items-center justify-between rounded-2xl border px-4 py-3.5 lg:min-h-0 lg:py-0 transition-all duration-500 ease-in-out
                      ${
                        isWinRow
                          ? "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.01]"
                          : isFailRow
                            ? "border-rose-500/40 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                            : isLockedRow
                              ? "border-[#f7d046]/40 bg-[#f7d046]/10 shadow-[0_0_15px_rgba(247,208,70,0.15)]"
                              : "border-white/10 bg-black/20"
                      }`}
                  >
                    <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-zinc-100">
                      <span className="truncate">{entry.displayName}</span>
                      {entry.userId === myUserId ? (
                        <span className="shrink-0 text-zinc-500 font-normal">
                          {t("match.scoreboard.you")}
                        </span>
                      ) : null}
                      {!entry.connected ? (
                        <span className="shrink-0 text-zinc-500 font-normal text-xs">
                          {t("match.scoreboard.offline")}
                        </span>
                      ) : null}
                    </div>

                    <div
                      className={`shrink-0 text-lg font-semibold transition-all duration-300
                        ${isWinRow ? "text-emerald-400 scale-125 font-bold" : "text-white"}`}
                    >
                      {entry.score}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
