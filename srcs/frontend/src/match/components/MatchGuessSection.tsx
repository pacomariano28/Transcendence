/** Lock status label and Spotify search form for the lock owner. */
import { useTranslation } from "react-i18next";
import type { SpotifySearchTrack } from "../../api/spotify";
//import { translateError } from "../../i18n/translateError";

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
};

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
}: MatchGuessSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      className={`card order-2 overflow-hidden p-6 lg:col-span-2 lg:row-start-2 ${
        isMatchFinished ? "animate-match-guess-exit !m-0 !border-0 !p-0" : ""
      }`}
    >
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
          {t("match.hud.lockLabel")}
        </div>

        <div className="relative h-7 mt-1">
          <div
            className={`absolute inset-0 transition-all duration-500 ease-in-out origin-left
                ${lockOwnerId ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"} 
                text-lg text-zinc-300`}
          >
            {t("match.hud.lockedBy", {
              name: lockOwnerName || t("match.user.player"),
            })}
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
        className={`transition-all duration-700 ease-in-out origin-top overflow-hidden
            ${roundPhase === "guessing" ? "opacity-100 scale-100 max-h-[600px] mt-5" : "opacity-0 scale-95 max-h-0 mt-0 pointer-events-none"}`}
      >
        <div className="rounded-2xl bg-black/20 p-4">
          {canGuess ? (
            <div className="mt-2">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  autoFocus
                  className="lock-input input flex-1 text-center uppercase"
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

              {selectedTrack && (
                <div className="select-text mt-3 text-xs text-emerald-300 transition-opacity animate-fade-in">
                  {t("match.guessingPanel.selectedPrefix", {
                    track: selectedTrack.track,
                    artist: selectedTrack.artist,
                  })}
                </div>
              )}

              {searchError && (
                <div className="mt-3 text-xs text-rose-300 animate-fade-in">
                  {translateError(searchError, t)}
                </div>
              )}

              {searching && (
                <div className="mt-3 text-xs text-zinc-500 animate-fade-in">
                  {t("match.guessingPanel.searching")}
                </div>
              )}

              {!searching &&
                !searchError &&
                searchTerm.trim().length >= 2 &&
                searchResults.length === 0 &&
                !selectedTrack && (
                  <div className="mt-3 text-xs text-zinc-500 animate-fade-in">
                    {t("match.guessingPanel.noResults")}
                  </div>
                )}

              {searchResults.length > 0 &&
                !selectedTrack &&
                searchTerm.trim().length >= 2 && (
                  <div className="select-text mt-3 grid gap-2 animate-fade-in">
                    {searchResults.map((track) => (
                      <button
                        key={track.id}
                        className="select-text rounded-xl border border-white/10 bg-black/30 p-3 text-left transition hover:border-white/20 hover:bg-black/40"
                        type="button"
                        onClick={() => onSelectTrack(track)}
                      >
                        <div className="text-sm font-medium text-zinc-100">
                          {track.track}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {track.artist}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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
