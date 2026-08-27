/**
 * Lock request via button or Space key. If audio was blocked by the browser,
 * resumes playback first and then emits `round:lock_request` with current time.
 */
import { useCallback, useEffect, type RefObject } from "react";
import { socket } from "../../api/socket";

type UseLockControlsOptions = {
  audioRef: RefObject<HTMLAudioElement | null>;
  canLock: boolean;
  lockRequested: boolean;
  setLockRequested: (value: boolean) => void;
  matchCode: string;
  showAudioRestoreNotice: boolean;
  resumeAudioFromUserGesture: () => Promise<void>;
  roundPhase: string;
};

export function useLockControls({
  audioRef,
  canLock,
  lockRequested,
  setLockRequested,
  matchCode,
  showAudioRestoreNotice,
  resumeAudioFromUserGesture,
  roundPhase,
}: UseLockControlsOptions) {
  const requestLock = useCallback(() => {
    if (!audioRef.current || !canLock || lockRequested) return;

    const emitLock = () => {
      if (!audioRef.current || lockRequested) return;
      setLockRequested(true);
      socket.emit("round:lock_request", {
        matchId: matchCode,
        time: audioRef.current.currentTime,
      });
    };

    if (showAudioRestoreNotice) {
      void resumeAudioFromUserGesture().then(emitLock);
      return;
    }

    emitLock();
  }, [
    audioRef,
    canLock,
    lockRequested,
    matchCode,
    showAudioRestoreNotice,
    resumeAudioFromUserGesture,
    setLockRequested,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      )
        return;

      if (roundPhase !== "playing") return;

      event.preventDefault();

      if (showAudioRestoreNotice) {
        void resumeAudioFromUserGesture().then(() => {
          if (canLock && !lockRequested) {
            requestLock();
          }
        });
        return;
      }

      if (canLock) {
        requestLock();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canLock,
    lockRequested,
    requestLock,
    resumeAudioFromUserGesture,
    roundPhase,
    showAudioRestoreNotice,
  ]);

  return { requestLock };
}
