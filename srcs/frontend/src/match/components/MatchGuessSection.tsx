/** Lock status label, guesser search form, and live typing preview for spectators. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import type { SpotifySearchTrack } from "../../api/spotify";
import { translateError } from "../../i18n/translateError";
import GuessTypingDisplay from "./GuessTypingDisplay";

const SEARCH_SELECTION_SLIDE_MS = 400;

type SearchSelectionSlide = {
  from: string;
  to: string;
  track: SpotifySearchTrack;
};

function formatTrackLabel(track: SpotifySearchTrack) {
  return `${track.track} - ${track.artist}`;
}

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
  onSubmitGuess: (track?: SpotifySearchTrack) => void;
  guessTypingText: string;
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
  guessTypingText,
  canSkip,
  hasSkipped,
  skipRequested,
  requestSkip,
}: MatchGuessSectionProps) {
  const { t } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const submitQueuedRef = useRef(false);
  const onSubmitGuessRef = useRef(onSubmitGuess);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectionSlide, setSelectionSlide] = useState<SearchSelectionSlide | null>(
    null,
  );

  useEffect(() => {
    onSubmitGuessRef.current = onSubmitGuess;
  }, [onSubmitGuess]);

  useEffect(() => {
    if (!canGuess) return;
    const timerId = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(timerId);
  }, [canGuess]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchResults]);

  const showSkipButton = roundPhase !== "guessing" && !isMatchFinished;

  const showSearchDropdown =
    canGuess && !selectedTrack && searchTerm.trim().length >= 2;

  const dropdownState = getSearchDropdownState({
    searching,
    searchError,
    searchResults,
  });

  const canNavigateResults =
    showSearchDropdown &&
    dropdownState === "results" &&
    searchResults.length > 0 &&
    !selectionSlide;

  useEffect(() => {
    if (!canNavigateResults) return;
    resultButtonRefs.current[highlightedIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [canNavigateResults, highlightedIndex]);

  useEffect(() => {
    if (!selectionSlide) return;

    const track = selectionSlide.track;
    const shouldSubmit = submitQueuedRef.current;
    submitQueuedRef.current = false;

    const timerId = window.setTimeout(() => {
      setSelectionSlide(null);
      searchInputRef.current?.focus();

      if (shouldSubmit) {
        onSubmitGuessRef.current(track);
      }
    }, SEARCH_SELECTION_SLIDE_MS);

    return () => window.clearTimeout(timerId);
  }, [selectionSlide]);

  const confirmHighlightedTrack = useCallback(() => {
    const track = searchResults[highlightedIndex];
    if (!track) return;

    const previousTerm = searchTerm;
    onSelectTrack(track);
    setSelectionSlide({
      from: previousTerm,
      to: formatTrackLabel(track),
      track,
    });
  }, [highlightedIndex, onSelectTrack, searchResults, searchTerm]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (selectionSlide) {
        event.preventDefault();
        if (event.key === "Enter") {
          submitQueuedRef.current = true;
        }
        return;
      }

      if (canNavigateResults) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setHighlightedIndex(
            (current) => (current + 1) % searchResults.length,
          );
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setHighlightedIndex(
            (current) =>
              (current - 1 + searchResults.length) % searchResults.length,
          );
          return;
        }
      }

      if (event.key !== "Enter") return;

      event.preventDefault();

      if (canNavigateResults) {
        confirmHighlightedTrack();
        return;
      }

      if (selectedTrack) {
        onSubmitGuess();
      }
    },
    [
      canNavigateResults,
      confirmHighlightedTrack,
      onSubmitGuess,
      searchResults.length,
      selectedTrack,
      selectionSlide,
    ],
  );

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
        className={`transition-[max-height,opacity,margin] duration-700 ease-in-out
            ${
              roundPhase === "guessing"
                ? "mt-5 max-h-[600px] opacity-100"
                : "pointer-events-none mt-0 max-h-0 overflow-hidden opacity-0"
            }`}
      >
        <div className="rounded-2xl bg-black/20 p-4">
          {canGuess ? (
            <div className="mt-2">
              <div className="relative">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <input
                      ref={searchInputRef}
                      className={`lock-input input w-full text-center ${
                        selectedTrack ? "normal-case" : "lowercase"
                      } ${selectionSlide ? "text-transparent caret-transparent" : ""}`}
                      placeholder={t("match.guessingPanel.searchPlaceholder")}
                      value={searchTerm}
                      onChange={(event) => {
                        onSearchTermChange(event.target.value);
                      }}
                      onKeyDown={handleSearchKeyDown}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      readOnly={Boolean(selectionSlide)}
                      disabled={!canGuess}
                      aria-activedescendant={
                        canNavigateResults
                          ? `guess-search-option-${searchResults[highlightedIndex]?.id}`
                          : undefined
                      }
                      aria-expanded={showSearchDropdown}
                      aria-controls="guess-search-listbox"
                      role="combobox"
                      aria-autocomplete="list"
                    />
                    {selectionSlide ? (
                      <div
                        className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
                        aria-hidden="true"
                      >
                        <div className="flex h-full items-center justify-center px-3 text-center normal-case tracking-[0.1em] text-zinc-100">
                          <span className="animate-search-value-exit absolute inset-x-3 truncate">
                            {selectionSlide.from}
                          </span>
                          <span className="animate-search-value-enter absolute inset-x-3 truncate">
                            {selectionSlide.to}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <button
                    className={`btn-glow submit-guess w-full sm:w-44 transition-all duration-300 ${!canGuess || !selectedTrack ? "opacity-50" : "animate-bounce scale-95"}`}
                    style={{ "--btn-color": "#4ade80" } as React.CSSProperties}
                    type="button"
                    onClick={() => onSubmitGuess()}
                    disabled={!canGuess || !selectedTrack}
                  >
                    <span>{t("match.guessingPanel.submitButton")}</span>
                  </button>
                </div>

                {showSearchDropdown ? (
                  <div className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-2xl border border-white/10 bg-[#141416] shadow-[0_-8px_30px_rgba(0,0,0,0.45)] backdrop-blur">
                    {dropdownState === "results" ? (
                      <div
                        id="guess-search-listbox"
                        role="listbox"
                        key="results"
                        className="select-text scrollbar-hidden animate-guess-dropdown-enter grid max-h-40 origin-bottom gap-2 overflow-y-auto overscroll-contain p-2 sm:max-h-48 lg:max-h-60"
                      >
                        {searchResults.map((track, index) => {
                          const isHighlighted = index === highlightedIndex;

                          return (
                            <button
                              key={track.id}
                              id={`guess-search-option-${track.id}`}
                              ref={(element) => {
                                resultButtonRefs.current[index] = element;
                              }}
                              role="option"
                              aria-selected={isHighlighted}
                              className={`select-text rounded-xl border p-3 text-left transition ${
                                isHighlighted
                                  ? "border-[#f7d046]/50 bg-black/50 ring-1 ring-[#f7d046]/30"
                                  : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-black/40"
                              }`}
                              type="button"
                              onMouseEnter={() => setHighlightedIndex(index)}
                              onClick={() => onSelectTrack(track)}
                            >
                              <div className="text-sm font-bold text-white">
                                {track.track}
                              </div>
                              <div className="text-sm font-light text-white">
                                {track.artist}
                              </div>
                            </button>
                          );
                        })}
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
            <div className="mt-2">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                {t("match.guessingPanel.guessing")}
              </div>
              <div
                className="input mt-3 flex min-h-[2.75rem] items-center justify-center text-center lowercase tracking-[0.1em] text-zinc-100"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="sr-only">{guessTypingText}</span>
                <GuessTypingDisplay text={guessTypingText} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
