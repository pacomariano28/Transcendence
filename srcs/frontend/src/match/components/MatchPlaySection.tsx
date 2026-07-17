/** Left column: audio stage + lock button (+ playlist error). */
import type { RefObject } from "react";
import { handleMouseMoveToSetFillOrigin } from "../../utils/buttonHover";
import type { GuessSelectedTrack, GuessStatus } from "../types";
import MatchAudioStage from "./MatchAudioStage";

type MatchPlaySectionProps = {
  isMatchFinished: boolean;
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
  showCooldownUi: boolean;
  cooldownSeconds: number;
  canLock: boolean;
  lockRequested: boolean;
  requestLock: () => void;
  playlistError: string | null | undefined;
};

export default function MatchPlaySection({
  isMatchFinished,
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
  showCooldownUi,
  cooldownSeconds,
  canLock,
  lockRequested,
  requestLock,
  playlistError,
}: MatchPlaySectionProps) {
  return (
    <section
      className={`card order-1 overflow-hidden p-6 lg:col-start-1 lg:row-start-1 lg:flex lg:h-[24rem] lg:flex-col ${
        isMatchFinished ? "animate-match-play-exit !m-0 !border-0 !p-0" : ""
      }`}
    >
      <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
        <MatchAudioStage
          canvasRef={canvasRef}
          showTrackTimer={showTrackTimer}
          songRemainingSeconds={songRemainingSeconds}
          roundPhase={roundPhase}
          showAudioNotice={showAudioNotice}
          resumeAudioFromUserGesture={resumeAudioFromUserGesture}
          showCountdown={showCountdown}
          countdownSeconds={countdownSeconds}
          showEq={showEq}
          showGuessPanel={showGuessPanel}
          guessStatus={guessStatus}
          showResultText={showResultText}
          guessSeconds={guessSeconds}
          guessResultTrack={guessResultTrack}
          onGuessTransitionEnd={onGuessTransitionEnd}
        />

        <button
          className="btn-glow h-14 w-full shrink-0 transition-all duration-500 disabled:opacity-40"
          style={
            {
              "--btn-color": showCooldownUi ? "#f43f5e" : "#f7d046",
            } as React.CSSProperties
          }
          type="button"
          disabled={!canLock || lockRequested}
          onClick={requestLock}
          onMouseMove={handleMouseMoveToSetFillOrigin}
        >
          <span>
            {lockRequested
              ? "Locking..."
              : showCooldownUi
                ? `Cooldown (${cooldownSeconds}s)`
                : "Lock (Space)"}
          </span>
        </button>
      </div>

      {playlistError && (
        <div className="mt-4 rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 text-rose-200">
          {playlistError}
        </div>
      )}
    </section>
  );
}
