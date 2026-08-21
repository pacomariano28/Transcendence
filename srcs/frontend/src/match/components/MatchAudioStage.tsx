/**
 * Stacked overlay zones for the audio stage: track timer, restore notice,
 * countdown, equalizer canvas, and guess/resolution states.
 */
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import type { GuessSelectedTrack, GuessStatus } from "../types";

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

type AlbumCoverProps = {
  track: GuessSelectedTrack;
  ringClassName: string;
  openInSpotifyLabel: string;
};

function AlbumCover({ track, ringClassName, openInSpotifyLabel }: AlbumCoverProps) {
  const coverInner = track.imageUrl ? (
    <img
      src={track.imageUrl}
      alt=""
      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-zinc-800/80 text-2xl text-white">
      ♪
    </div>
  );

  const coverShell = (
    <div className="animate-song-reveal-cover h-full w-full overflow-hidden rounded-[10px]">
      {coverInner}
    </div>
  );

  const sharedClasses = `relative block h-20 w-20 shrink-0 rounded-xl shadow-2xl ring-2 sm:h-24 sm:w-24 ${ringClassName}`;

  if (!track.spotifyUrl) {
    return <div className={sharedClasses}>{coverShell}</div>;
  }

  return (
    <a
      href={track.spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={openInSpotifyLabel}
      className={`group ${sharedClasses} cursor-pointer transition-all duration-300 ease-out hover:scale-[1.04] hover:shadow-[0_8px_28px_rgba(247,208,70,0.28)] hover:ring-[#f7d046]/55 focus-visible:outline-none focus-visible:ring-[#f7d046]/70`}
    >
      {coverShell}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 opacity-0 transition-all duration-300 ease-out group-hover:bg-black/45 group-hover:opacity-100">
        <SpotifyIcon className="h-7 w-7 text-[#1DB954] drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out group-hover:scale-110" />
      </span>
    </a>
  );
}

type SongRevealDisplayProps = {
  track: GuessSelectedTrack;
  showCover: boolean;
  ringClassName?: string;
};

function SongRevealDisplay({
  track,
  showCover,
  ringClassName = "ring-white/20",
}: SongRevealDisplayProps) {
  const { t } = useTranslation();

  return (
    <div key={track.isrc} className="flex max-w-md items-center gap-4 px-4">
      {showCover && (
        <AlbumCover
          track={track}
          ringClassName={ringClassName}
          openInSpotifyLabel={t("match.hud.openInSpotify", { track: track.track })}
        />
      )}
      <div className="flex min-w-0 flex-col items-start gap-1 text-left">
        <div className="animate-song-reveal-title text-sm font-bold text-white">
          {track.track}
        </div>
        <div className="animate-song-reveal-artist text-sm font-light text-white">
          {track.artist}
        </div>
      </div>
    </div>
  );
}

function SongTextRow({ track }: { track: GuessSelectedTrack }) {
  return (
    <div
      key={track.isrc}
      className="flex max-w-md flex-wrap items-baseline justify-center gap-x-2 gap-y-1 px-4"
    >
      <span className="animate-song-reveal-title text-sm font-bold text-white">
        {track.track}
      </span>
      <span className="animate-song-reveal-artist text-sm font-light text-white">
        {track.artist}
      </span>
    </div>
  );
}

type GuessStatusHeadingProps = {
  label: string;
  className: string;
};

function GuessStatusHeading({ label, className }: GuessStatusHeadingProps) {
  return (
    <p
      className={`animate-guess-status-enter text-xs font-medium uppercase tracking-[0.35em] sm:text-sm ${className}`}
    >
      {label}
    </p>
  );
}

type GuessResolutionBlockProps = {
  label: string;
  labelClassName: string;
  track: GuessSelectedTrack | null;
  showCover: boolean;
  ringClassName?: string;
  trackLayout?: "card" | "row";
};

function GuessResolutionBlock({
  label,
  labelClassName,
  track,
  showCover,
  ringClassName,
  trackLayout = "card",
}: GuessResolutionBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4">
      <GuessStatusHeading label={label} className={labelClassName} />
      {track && (
        <div className="mt-4">
          {trackLayout === "row" ? (
            <SongTextRow track={track} />
          ) : (
            <SongRevealDisplay
              track={track}
              showCover={showCover}
              ringClassName={ringClassName}
            />
          )}
        </div>
      )}
    </div>
  );
}

type MatchAudioStageProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  showTrackTimer: boolean;
  songRemainingSeconds: number | null;
  roundPhase: string;
  showAudioNotice: boolean;
  resumeAudioFromUserGesture: () => Promise<void>;
  showCountdown: boolean;
  countdownSeconds: number | null;
  showEq: boolean;
  showGuessPanel: boolean;
  guessStatus: GuessStatus;
  guessSeconds: number | null;
  guessResultTrack: GuessSelectedTrack | null;
};

export default function MatchAudioStage({
  canvasRef,
  showTrackTimer,
  songRemainingSeconds,
  roundPhase,
  showAudioNotice,
  resumeAudioFromUserGesture,
  showCountdown,
  countdownSeconds,
  showEq,
  showGuessPanel,
  guessStatus,
  guessSeconds,
  guessResultTrack,
}: MatchAudioStageProps) {
  const { t } = useTranslation();

  return (
    <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20 sm:h-52 lg:min-h-0 lg:h-auto lg:flex-1">
      <div
        className={`absolute top-4 left-4 z-30 flex h-7 max-w-[calc(100%-2rem)] items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-3 font-mono text-xs font-medium text-zinc-300 backdrop-blur-md transition-opacity duration-700 ease-in-out
                    ${showTrackTimer ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <span className="relative h-2 w-2 shrink-0">
          <span
            className={`absolute inset-0 rounded-full bg-amber-400 opacity-75 ${roundPhase === "playing" ? "animate-ping" : ""}`}
          ></span>
          <span className="relative block h-2 w-2 rounded-full bg-[#f7d046]"></span>
        </span>
        <span className="relative shrink-0 translate-y-[1px] whitespace-nowrap">
          {t("match.hud.trackTime", { seconds: songRemainingSeconds ?? 0 })}
        </span>
      </div>

      <div
        role="button"
        tabIndex={showAudioNotice ? 0 : -1}
        onClick={() => {
          if (showAudioNotice) void resumeAudioFromUserGesture();
        }}
        onKeyDown={(event) => {
          if (
            showAudioNotice &&
            (event.code === "Enter" || event.code === "Space")
          ) {
            event.preventDefault();
            void resumeAudioFromUserGesture();
          }
        }}
        className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-all duration-700 ease-in-out
                  ${showAudioNotice ? "cursor-pointer opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"}`}
      >
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
          {t("match.hud.audioUnavailable")}
        </div>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-300">
          {t("match.hud.audioRestoreInstructions")}
        </p>
      </div>

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-700 ease-in-out
                  ${showCountdown ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
          {t("match.hud.startsIn")}
        </div>
        <div className="mt-3 text-6xl font-semibold text-white sm:text-7xl">
          {countdownSeconds ?? ""}
        </div>
      </div>

      <div
        className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-700 ease-in-out
                  ${showEq ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <canvas
          ref={canvasRef}
          width={1200}
          height={240}
          className="h-full max-h-full w-full"
        />
      </div>

      <div
        className={`absolute inset-0 flex flex-col items-center text-center transition-all duration-500 ease-in-out
                  ${showGuessPanel ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
                  ${showGuessPanel && showTrackTimer ? "max-sm:justify-start max-sm:pt-14 sm:justify-center" : "justify-center"}`}
      >
        <div className="flex w-full flex-col items-center justify-center text-center max-sm:px-4 sm:absolute sm:inset-0">
          {guessStatus === "countdown" && (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="max-w-[12rem] text-xs font-medium uppercase leading-snug tracking-[0.2em] text-zinc-400 sm:max-w-none sm:tracking-[0.24em]">
                {t("match.hud.guessTimeRemaining")}
              </div>
              <div
                className={`mt-3 text-6xl font-bold transition-all duration-500 sm:text-7xl
                          ${(guessSeconds ?? 10) <= 5 ? "text-red-500 animate-pulse scale-110" : "text-amber-300"}`}
              >
                {guessSeconds ?? 0}
              </div>
              <div className="mt-2 text-sm text-zinc-500">{t("match.hud.seconds")}</div>
            </div>
          )}

          {guessStatus === "expired" && (
            <GuessStatusHeading
              label={t("match.hud.timeout")}
              className="text-red-400"
            />
          )}

          {guessStatus === "wrong" && (
            <GuessResolutionBlock
              label={t("match.hud.wrongAnswer")}
              labelClassName="text-red-400"
              track={guessResultTrack}
              showCover={false}
              trackLayout="row"
            />
          )}

          {guessStatus === "revealed" && (
            <GuessResolutionBlock
              label={t("match.hud.timeout")}
              labelClassName="text-amber-300"
              track={guessResultTrack}
              showCover
              ringClassName="ring-[#f7d046]/30"
            />
          )}

          {guessStatus === "skipped" && (
            <GuessResolutionBlock
              label={t("match.hud.songSkipped")}
              labelClassName="text-[#f7d046]"
              track={guessResultTrack}
              showCover
              ringClassName="ring-[#f7d046]/30"
            />
          )}

          {guessStatus === "correct" && (
            <GuessResolutionBlock
              label={t("match.hud.correctAnswer")}
              labelClassName="text-emerald-400"
              track={guessResultTrack}
              showCover
              ringClassName="ring-emerald-400/30"
            />
          )}
        </div>
      </div>
    </div>
  );
}
