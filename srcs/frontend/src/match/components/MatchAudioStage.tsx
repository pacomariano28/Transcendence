/**
 * Stacked overlay zones for the audio stage: track timer, restore notice,
 * countdown, equalizer canvas, and guess/resolution states.
 */
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import type { GuessSelectedTrack, GuessStatus } from "../types";

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
  return (
    <div key={track.isrc} className="flex max-w-md items-center gap-4 px-4">
      {showCover &&
        (track.imageUrl ? (
          <img
            src={track.imageUrl}
            alt=""
            className={`animate-song-reveal-cover h-20 w-20 shrink-0 rounded-xl object-cover shadow-2xl ring-2 sm:h-24 sm:w-24 ${ringClassName}`}
          />
        ) : (
          <div
            className={`animate-song-reveal-cover flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 text-2xl text-white shadow-2xl ring-2 sm:h-24 sm:w-24 ${ringClassName}`}
          >
            ♪
          </div>
        ))}
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
        className={`absolute top-4 left-4 z-30 flex h-7 items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-3 font-mono text-xs font-medium text-zinc-300 backdrop-blur-md transition-opacity duration-700 ease-in-out
                    ${showTrackTimer ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <span className="relative h-2 w-2 shrink-0">
          <span
            className={`absolute inset-0 rounded-full bg-amber-400 opacity-75 ${roundPhase === "playing" ? "animate-ping" : ""}`}
          ></span>
          <span className="relative block h-2 w-2 rounded-full bg-[#f7d046]"></span>
        </span>
        <span className="relative transform translate-y-[1px]">
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
        className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out
                  ${showGuessPanel ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {guessStatus === "countdown" && (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
                {t("match.hud.guessTimeRemaining")}
              </div>
              <div
                className={`mt-3 text-7xl font-bold transition-all duration-500
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
