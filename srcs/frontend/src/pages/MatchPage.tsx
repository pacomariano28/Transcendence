/**
 * Match page orchestrator.
 *
 * Owns the shared round state that multiple hooks must read/write (phase, scores,
 * lock owner, guess resolution). Side effects are delegated to hooks under
 * `src/match/hooks/`; presentation lives in `src/match/components/`.
 *
 * Round flow (server is source of truth via socket events):
 *   sync → countdown → playing → [lock] → guessing → resolution → resume → … → finished
 *
 * `roundPhase` mirrors the client-side round UI state; `matchState.phase` is the
 * server match lifecycle (lobby / in-game / finished).
 */
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/auth-context";
import { useActiveMatch } from "../context/active.match.context";
import type { MatchStatePayload, ScoreEntry } from "../types/socket.payloads";
import NotFoundPage from "./NotFoundPage";
import MatchPageHeader from "../match/components/MatchPageHeader";
import MatchPlaySection from "../match/components/MatchPlaySection";
import MatchGuessSection from "../match/components/MatchGuessSection";
import MatchScoreboardSection from "../match/components/MatchScoreboardSection";
import { useAudioVisualizer } from "../match/hooks/useAudioVisualizer";
import { useMatchCooldown } from "../match/hooks/useMatchCooldown";
import { useGuessTimer } from "../match/hooks/useGuessTimer";
import { useSpotifyGuessSearch } from "../match/hooks/useSpotifyGuessSearch";
import { useMatchAudio } from "../match/hooks/useMatchAudio";
import { useLockControls } from "../match/hooks/useLockControls";
import { useMatchHydration } from "../match/hooks/useMatchHydration";
import { useActiveMatchSync } from "../match/hooks/useActiveMatchSync";
import { useMatchSocket } from "../match/hooks/useMatchSocket";
import {
  buildResultsData,
  buildScoreboard,
  getLockOwnerName,
  getMatchDisplayFlags,
} from "../match/selectors";
import { normalizeCode } from "../match/utils";
import { translateError } from "../i18n/translateError";
import type {
  GuessSelectedTrack,
  GuessStatus,
  RoundSyncPayload,
} from "../match/types";

export default function MatchPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { code: codeParam } = useParams();
  const { user } = useAuth();
  const { setActiveMatch } = useActiveMatch();

  const code = useMemo(() => normalizeCode(codeParam ?? ""), [codeParam]);
  const myUserId = user ? String(user.id) : null;

  // --- Shared round state (updated by useMatchSocket and read by UI selectors) ---
  const [matchState, setMatchState] = useState<MatchStatePayload | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundInfo, setRoundInfo] = useState<RoundSyncPayload | null>(null);
  const [roundPhase, setRoundPhase] = useState("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [lockOwnerId, setLockOwnerId] = useState<string | null>(null);
  const [guessEndsAt, setGuessEndsAt] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [finalScores, setFinalScores] = useState<ScoreEntry[] | null>(null);
  const [lockRequested, setLockRequested] = useState(false);

  // Guess resolution overlays (countdown / wrong / correct / timeout) in MatchAudioStage
  const [guessStatus, setGuessStatus] = useState<GuessStatus>("countdown");
  const [showResultText, setShowResultText] = useState(false);
  const [guessResultTrack, setGuessResultTrack] =
    useState<GuessSelectedTrack | null>(null);

  const { setCooldownEndsAt, isCooldownActive, cooldownSeconds } =
    useMatchCooldown(code, normalizeCode(codeParam ?? ""));

  const { guessSeconds, setGuessSeconds } = useGuessTimer(guessEndsAt);

  const canGuess =
    roundPhase === "guessing" &&
    Boolean(lockOwnerId && lockOwnerId === myUserId);

  const {
    searchTerm,
    searchResults,
    searching,
    searchError,
    selectedTrack,
    resetSearch,
    selectTrack,
    handleSearchTermChange,
    submitGuess,
  } = useSpotifyGuessSearch({ canGuess, matchCode: code });

  const handleAudioError = useCallback((message: string) => {
    setError(message);
  }, []);

  const {
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
    updateTrackTimerDisplay,
  } = useMatchAudio({
    audioUrl,
    roundInfo,
    code,
    onAudioError: handleAudioError,
  });

  useAudioVisualizer(analyserRef, canvasRef);

  // HTTP bootstrap before/alongside socket; socket remains authoritative during play
  useMatchHydration({ code, setNotFound, setMatchState, setScores });

  // Keeps header/minimized match indicator in sync while the page is mounted
  useActiveMatchSync({
    code,
    roundInfo,
    matchState,
    notFound,
    roundPhase,
    finalScores,
    compactRoundLabel: roundInfo
      ? t("match.rounds.lbl", {
          current: roundInfo.roundIndex + 1,
          total: roundInfo.roundsTotal,
        })
      : undefined,
    setActiveMatch,
  });

  // All round:* and match:* socket handlers; intentionally receives many setters
  useMatchSocket({
    code,
    user,
    nav,
    setActiveMatch,
    audioRef,
    readyRoundRef,
    myUserId,
    lockOwnerId,
    tryPlayAudio,
    updateTrackTimerDisplay,
    setMatchState,
    setNotFound,
    setError,
    setRoundInfo,
    setRoundPhase,
    setAudioUrl,
    setAudioReady,
    setCountdownSeconds,
    setGuessSeconds,
    setSongRemainingSeconds,
    setGuessEndsAt,
    setLockOwnerId,
    setLockRequested,
    setScores,
    setFinalScores,
    setShowVisualizer,
    setCooldownEndsAt,
    setGuessStatus,
    setShowResultText,
    setGuessResultTrack,
    resetSearch,
  });

  const showCooldownUi = isCooldownActive && roundPhase === "playing";

  const canLock =
    roundPhase === "playing" && audioReady && !lockOwnerId && !isCooldownActive;

  const { requestLock } = useLockControls({
    audioRef,
    canLock,
    lockRequested,
    setLockRequested,
    matchCode: code,
    showAudioRestoreNotice,
    resumeAudioFromUserGesture,
    roundPhase,
  });

  const leaveFinishedMatch = useCallback(() => {
    setActiveMatch(null);
    nav("/");
  }, [nav, setActiveMatch]);

  const handleGuessTransitionEnd = useCallback(() => {
    // TypingText is shown only after the guess overlay CSS transition finishes
    if (
      (guessStatus === "wrong" ||
        guessStatus === "expired" ||
        guessStatus === "correct") &&
      !showResultText
    ) {
      setShowResultText(true);
    }
  }, [guessStatus, showResultText]);

  const roundLabel = roundInfo
    ? t("match.rounds.label", {
        current: roundInfo.roundIndex + 1,
        total: roundInfo.roundsTotal,
      })
    : t("match.rounds.waiting");

  const lockOwnerName = useMemo(
    () => getLockOwnerName(matchState, lockOwnerId),
    [matchState, lockOwnerId],
  );

  const scoreboard = useMemo(
    () => buildScoreboard(matchState, scores),
    [matchState, scores],
  );

  const playersList = matchState?.players || [];
  const resultsData = useMemo(
    () =>
      buildResultsData(
        finalScores,
        playersList,
        scores,
        t("match.user.playerFallback"),
      ),
    [finalScores, playersList, scores, t],
  );

  // Derive which overlays are visible in the audio stage (mutually exclusive layers)
  const {
    showGuessPanel,
    showAudioNotice,
    showCountdown,
    showEq,
    showTrackTimer,
    isMatchFinished,
  } = getMatchDisplayFlags({
    roundPhase,
    showAudioRestoreNotice,
    showVisualizer,
    songRemainingSeconds,
    matchPhase: matchState?.phase,
  });

  if (!code || notFound) {
    return <NotFoundPage title={t("match.errors.matchNotFoundTitle")} />;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center px-4 py-10 fade-in sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        <MatchPageHeader
          code={code}
          roundLabel={roundLabel}
          roundIndex={roundInfo?.roundIndex}
          isMatchFinished={isMatchFinished}
        />

        {error && (
          <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 text-rose-200">
            {translateError(error, t)}
          </div>
        )}

        <div
          className={`flex flex-col ${
            isMatchFinished ? "gap-0" : "gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_auto] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]"
          }`}
        >
          <MatchPlaySection
            isMatchFinished={isMatchFinished}
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
            onGuessTransitionEnd={handleGuessTransitionEnd}
            showCooldownUi={showCooldownUi}
            cooldownSeconds={cooldownSeconds}
            canLock={canLock}
            lockRequested={lockRequested}
            requestLock={requestLock}
            playlistError={roundInfo?.playlistError}
          />

          <MatchGuessSection
            isMatchFinished={isMatchFinished}
            roundPhase={roundPhase}
            lockOwnerId={lockOwnerId}
            lockOwnerName={lockOwnerName}
            canGuess={canGuess}
            searchTerm={searchTerm}
            onSearchTermChange={handleSearchTermChange}
            selectedTrack={selectedTrack}
            searchResults={searchResults}
            searching={searching}
            searchError={searchError}
            onSelectTrack={selectTrack}
            onSubmitGuess={submitGuess}
          />

          <MatchScoreboardSection
            isMatchFinished={isMatchFinished}
            resultsData={resultsData}
            myUserId={myUserId}
            onLeaveFinishedMatch={leaveFinishedMatch}
            scoreboard={scoreboard}
            lockOwnerId={lockOwnerId}
            roundPhase={roundPhase}
          />
        </div>
      </div>
    </div>
  );
}
