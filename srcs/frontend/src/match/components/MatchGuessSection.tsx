/** Lock status label and Spotify search form for the lock owner. */
import { Trans, useTranslation } from "react-i18next";
import type { SpotifySearchTrack } from "../../api/spotify";
import { translateError } from "../../i18n/translateError";

type MatchGuessSectionProps = {
  isMatchFinished: boolean;
  roundPhase: string;
  lockOwnerId: string | null;
  lockOwnerName: string;
  canGuess: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedTrack: SpotifySearchTrack | null;
  searchResults: SpotifySearchTrack[];
  searching: boolean;
  searchError: string | null;
  onSelectTrack: (track: SpotifySearchTrack) => void;
  onSubmitGuess: () => void;
  canSkip: boolean;
  hasSkipped: boolean;
  skipRequested: boolean;
  requestSkip: () => void;
};

type SearchDropdownState = "searching" | "error" | "results" | "empty";

function getSearchDropdownState(options: {
  searching: boolean;
  searchError: string | null;
  searchResults: SpotifySearchTrack[];
}): SearchDropdownState {
  if (options.searchError) return "error";
  if (options.searching) return "searching";
  if (options.searchResults.length > 0) return "results";
  return "empty";
}

export default function MatchGuessSection({
  isMatchFinished,
  roundPhase,
  lockOwnerId,
  lockOwnerName,
  canGuess,
  searchTerm,
  onSearchTermChange,
  selectedTrack,
  searchResults,
  searching,
  searchError,
  onSelectTrack,
  onSubmitGuess,
  canSkip,
  hasSkipped,
  skipRequested,
  requestSkip,
}: MatchGuessSectionProps) {
  const { t } = useTranslation();

  const showSkipButton = roundPhase !== "guessing" && !isMatchFinished;

  const showSearchDropdown =
    canGuess && !selectedTrack && searchTerm.trim().length >= 2;

  const dropdownState = getSearchDropdownState({
    searching,
    searchError,
    searchResults,
  });

  return (
    <section
      className={`card order-2 p-6 lg:col-span-2 lg:row-start-2 ${
        roundPhase === "guessing" ? "relative z-40" : ""
      } ${
        isMatchFinished
          ? "animate-match-guess-exit overflow-hidden !m-0 !border-0 !p-0"
          : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="truncate text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
            {t("match.hud.lockLabel")}
          </div>

          <div className="relative h-7 mt-1">
            <div
              className={`absolute inset-0 transition-all duration-500 ease-in-out origin-left
                ${lockOwnerId ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"} 
                text-lg text-zinc-300`}
            >
              <Trans
                i18nKey="match.hud.lockedBy"
                values={{
                  name: lockOwnerName || t("match.user.player"),
                }}
                components={{
                  bold: <span className="font-bold text-white" />,
                }}
              />
            </div>
            <div
              className={`absolute inset-0 transition-all duration-500 ease-in-out origin-left
                ${!lockOwnerId ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"} 
                text-sm text-zinc-400`}
            >
              {t("match.hud.firstLockWins")}
            </div>
          </div>
        </div>

        <div
          className={`shrink-0 overflow-hidden transition-all duration-500 ease-in-out
            ${
              showSkipButton
                ? "max-w-[12rem] opacity-100"
                : "pointer-events-none max-w-0 opacity-0"
            }`}
        >
          <button
            className="whitespace-nowrap bg-transparent p-0 text-sm font-bold uppercase tracking-[0.2em] text-[#f7d046] transition-opacity duration-300 hover:opacity-80 disabled:pointer-events-none disabled:opacity-40 disabled:hover:opacity-40"
            type="button"
            disabled={!canSkip || hasSkipped || skipRequested}
            onClick={requestSkip}
          >
            {t("match.scoreboard.skipLabel")}
          </button>
        </div>
      </div>

      <div
        className={`transition-all duration-700 ease-in-out origin-top
            ${
              roundPhase === "guessing"
                ? "mt-5 max-h-[600px] scale-100 opacity-100"
                : "pointer-events-none mt-0 max-h-0 scale-95 overflow-hidden opacity-0"
            }`}
      >
        <div className="rounded-2xl bg-black/20 p-4">
          {canGuess ? (
            <div className="mt-2">
              <div className="relative">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    autoFocus
                    className={`lock-input input flex-1 text-center ${
                      selectedTrack ? "normal-case" : "lowercase"
                    }`}
                    placeholder={t("match.guessingPanel.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(event) => {
                      onSearchTermChange(event.target.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      onSubmitGuess();
                    }}
                    disabled={!canGuess}
                  />
                  <button
                    className={`btn-glow submit-guess w-full sm:w-44 transition-all duration-300 ${!canGuess || !selectedTrack ? "opacity-50" : "animate-bounce scale-95"}`}
                    style={{ "--btn-color": "#4ade80" } as React.CSSProperties}
                    type="button"
                    onClick={onSubmitGuess}
                    disabled={!canGuess || !selectedTrack}
                  >
                    <span>{t("match.guessingPanel.submitButton")}</span>
                  </button>
                </div>

                {showSearchDropdown ? (
                  <div className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-2xl border border-white/10 bg-[#141416] shadow-[0_-8px_30px_rgba(0,0,0,0.45)] backdrop-blur">
                    {dropdownState === "results" ? (
                      <div
                        key="results"
                        className="select-text scrollbar-hidden animate-guess-dropdown-enter grid max-h-40 origin-bottom gap-2 overflow-y-auto overscroll-contain p-2 sm:max-h-48 lg:max-h-60"
                      >
                        {searchResults.map((track) => (
                          <button
                            key={track.id}
                            className="select-text rounded-xl border border-white/10 bg-black/30 p-3 text-left transition hover:border-white/20 hover:bg-black/40"
                            type="button"
                            onClick={() => onSelectTrack(track)}
                          >
                            <div className="text-sm font-bold text-white">
                              {track.track}
                            </div>
                            <div className="text-sm font-light text-white">
                              {track.artist}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div
                        key={dropdownState}
                        className="guess-search-dropdown-panel guess-search-dropdown-panel-active flex h-14 items-center justify-center px-4 text-center text-sm"
                      >
                        {dropdownState === "searching" ? (
                          <span className="text-zinc-400">
                            {t("match.guessingPanel.searching")}
                          </span>
                        ) : null}
                        {dropdownState === "error" && searchError ? (
                          <span className="text-rose-300">
                            {translateError(searchError, t)}
                          </span>
                        ) : null}
                        {dropdownState === "empty" ? (
                          <span className="text-zinc-500">
                            {t("match.guessingPanel.noResults")}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-zinc-400">
              {t("match.guessingPanel.waitingForOwner")}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
