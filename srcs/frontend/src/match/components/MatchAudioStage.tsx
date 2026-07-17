/**
 * Stacked overlay zones for the audio stage: track timer, restore notice,
 * countdown, equalizer canvas, and guess/resolution states.
 */
import type { RefObject } from "react";
import TypingText from "../../components/TypingText";
import type { GuessSelectedTrack, GuessStatus } from "../types";

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
  showResultText: boolean;
  guessSeconds: number | null;
  guessResultTrack: GuessSelectedTrack | null;
  onGuessTransitionEnd: () => void;
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
  showResultText,
  guessSeconds,
  guessResultTrack,
  onGuessTransitionEnd,
}: MatchAudioStageProps) {
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
          Track: {songRemainingSeconds ?? 0}s
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
          Audio unavailable
        </div>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-300">
          Audio is unavailable after reloading. Tap here to restore playback.
        </p>
      </div>

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-700 ease-in-out
                  ${showCountdown ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
          Starts in
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
        onTransitionEnd={onGuessTransitionEnd}
        className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out
                  ${showGuessPanel ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        {/* Each guess outcome is an absolute layer; only one is visible at a time */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out
                    ${guessStatus === "countdown" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
        >
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
            Guess time remaining
          </div>
          <div
            className={`mt-3 text-7xl font-bold transition-all duration-500
                      ${(guessSeconds ?? 10) <= 5 ? "text-red-500 animate-pulse scale-110" : "text-amber-300"}`}
          >
            {guessSeconds ?? 0}
          </div>
          <div className="mt-2 text-sm text-zinc-500">seconds</div>
        </div>

        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out
                    ${guessStatus === "expired" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
        >
          {showResultText && guessStatus === "expired" && (
            <TypingText key="timeout" text="TIMEOUT!" size="md" />
          )}
        </div>

        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out
                    ${guessStatus === "wrong" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
        >
          {showResultText && guessStatus === "wrong" && (
            <>
              <TypingText key="wrong" text="WRONG ANSWER!" size="md" />
              {guessResultTrack && (
                <div className="mt-4 max-w-md px-4 text-sm font-medium text-rose-400">
                  {guessResultTrack.track} - {guessResultTrack.artist}
                </div>
              )}
            </>
          )}
        </div>

        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out
                    ${guessStatus === "correct" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
        >
          {showResultText && guessStatus === "correct" && (
            <>
              <TypingText key="correct" text="CORRECT ANSWER!" size="md" />
              {guessResultTrack && (
                <div className="mt-4 max-w-md px-4 text-sm font-medium text-emerald-400">
                  {guessResultTrack.track} - {guessResultTrack.artist}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
