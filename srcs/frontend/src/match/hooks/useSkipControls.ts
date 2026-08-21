/**
 * Skip request for the current round. Each player can skip once per round;
 * the server decides when all connected players have skipped.
 */
import { useCallback } from "react";
import { socket } from "../../api/socket";

type UseSkipControlsOptions = {
  canSkip: boolean;
  skipRequested: boolean;
  setSkipRequested: (value: boolean) => void;
  matchCode: string;
};

export function useSkipControls({
  canSkip,
  skipRequested,
  setSkipRequested,
  matchCode,
}: UseSkipControlsOptions) {
  const requestSkip = useCallback(() => {
    if (!canSkip || skipRequested) return;

    setSkipRequested(true);
    socket.emit("round:skip_request", { matchId: matchCode });
  }, [canSkip, skipRequested, setSkipRequested, matchCode]);

  return { requestSkip };
}
