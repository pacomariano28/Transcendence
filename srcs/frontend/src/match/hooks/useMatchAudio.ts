/**
 * Manages preview audio lifecycle: element creation, Web Audio analyser hookup,
 * server sync (round:ready / preview_ended), and playback position recovery.
 *
 * Browser autoplay policies may block `play()` after reload — in that case
 * `showAudioRestoreNotice` prompts a user gesture via resumeAudioFromUserGesture.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../../api/socket";
import { SECOND_MS, SKIP_FADE_MS } from "../constants";
import type { RoundSyncPayload } from "../types";

type UseMatchAudioOptions = {
  audioUrl: string | null;
  roundInfo: RoundSyncPayload | null;
  code: string;
  onAudioError: (message: string) => void;
};

export function useMatchAudio({
  audioUrl,
  roundInfo,
  code,
  onAudioError,
}: UseMatchAudioOptions) {
  const [audioReady, setAudioReady] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showAudioRestoreNotice, setShowAudioRestoreNotice] = useState(false);
  const [songRemainingSeconds, setSongRemainingSeconds] = useState<
    number | null
  >(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const readyRoundRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackSyncRef = useRef<{ anchorAt: number; offsetSec: number } | null>(
    null,
  );
  const showAudioRestoreNoticeRef = useRef(false);

  useEffect(() => {
    showAudioRestoreNoticeRef.current = showAudioRestoreNotice;
    if (showAudioRestoreNotice) {
      setSongRemainingSeconds(null);
    }
  }, [showAudioRestoreNotice]);

  const updateTrackTimerDisplay = useCallback((offsetSec: number) => {
    // Anchor + offset lets us re-sync after lock/resume without drift
    playbackSyncRef.current = { anchorAt: Date.now(), offsetSec };
    const duration = audioRef.current?.duration;
    if (!duration || isNaN(duration)) return;
    setSongRemainingSeconds(Math.max(0, Math.ceil(duration - offsetSec)));
  }, []);

  const applySyncedPlaybackPosition = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const sync = playbackSyncRef.current;
    const elapsed = sync ? (Date.now() - sync.anchorAt) / SECOND_MS : 0;
    const position = sync ? sync.offsetSec + elapsed : audio.currentTime;
    const duration = audio.duration;
    const playbackTime =
      duration && !isNaN(duration)
        ? Math.min(Math.max(0, position), duration)
        : Math.max(0, position);

    audio.currentTime = playbackTime;
    updateTrackTimerDisplay(playbackTime);
  }, [updateTrackTimerDisplay]);

  const tryPlayAudio = useCallback(
    (resumeTime: number | null) => {
      const audio = audioRef.current;

      if (resumeTime !== null) {
        playbackSyncRef.current = { anchorAt: Date.now(), offsetSec: resumeTime };
        if (audio) {
          audio.currentTime = resumeTime;
        }
      }

      if (!audio) return;

      audio
        .play()
        .then(() => {
          setShowAudioRestoreNotice(false);
          applySyncedPlaybackPosition();
        })
        .catch(() => setShowAudioRestoreNotice(true));
    },
    [applySyncedPlaybackPosition],
  );

  const resumeAudioFromUserGesture = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    const ctx = audioContextRef.current;
    if (ctx?.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        setShowAudioRestoreNotice(true);
        return;
      }
    }

    applySyncedPlaybackPosition();

    try {
      await audio.play();
      setShowAudioRestoreNotice(false);
      setShowVisualizer(true);
    } catch {
      setShowAudioRestoreNotice(true);
    }
  }, [applySyncedPlaybackPosition]);

  const fadeOutAudio = useCallback(
    (durationMs = SKIP_FADE_MS): Promise<void> => {
      const audio = audioRef.current;
      if (!audio) return Promise.resolve();

      return new Promise((resolve) => {
        const startVolume = audio.volume;
        const steps = 20;
        const stepMs = durationMs / steps;
        let step = 0;

        const interval = window.setInterval(() => {
          step += 1;
          audio.volume = Math.max(0, startVolume * (1 - step / steps));

          if (step >= steps) {
            window.clearInterval(interval);
            audio.pause();
            audio.volume = startVolume;
            resolve();
          }
        }, stepMs);
      });
    },
    [],
  );

  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio(audioUrl);
    audio.preload = "auto";

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const handleReady = () => {
      setAudioReady(true);
      // Emit once per round when the preview is buffered — server waits for all clients
      if (roundInfo && readyRoundRef.current !== roundInfo.roundIndex) {
        socket.emit("round:ready");
        readyRoundRef.current = roundInfo.roundIndex;
      }
    };

    const handleEnded = () => {
      setShowVisualizer(false);
      if (!roundInfo || !code) return;
      socket.emit("round:preview_ended", {
        matchId: code,
        roundIndex: roundInfo.roundIndex,
      });
    };

    const handleError = () => {
      onAudioError("AUDIO_LOAD_FAILED");
    };

    const handleTimeUpdate = () => {
      if (showAudioRestoreNoticeRef.current) return;

      const remaining = Math.max(
        0,
        Math.ceil(audio.duration - audio.currentTime),
      );
      if (!isNaN(remaining)) {
        setSongRemainingSeconds(remaining);
      }
    };

    audio.addEventListener("canplaythrough", handleReady);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleTimeUpdate);
    audio.load();
    audioRef.current = audio;

    return () => {
      audio.removeEventListener("canplaythrough", handleReady);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleTimeUpdate);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      audioContextRef.current?.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    };
  }, [audioUrl, roundInfo, code, onAudioError]);

  return {
    audioRef,
    readyRoundRef,
    canvasRef,
    analyserRef,
    audioReady,
    setAudioReady,
    showVisualizer,
    setShowVisualizer,
    showAudioRestoreNotice,
    songRemainingSeconds,
    setSongRemainingSeconds,
    tryPlayAudio,
    resumeAudioFromUserGesture,
    fadeOutAudio,
    updateTrackTimerDisplay,
  };
}
