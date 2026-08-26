import { socket } from "../api/socket";
import { getState } from "../api/state";
import { ensureEnoughSongsForMatch } from "../api/playlist";

async function ensureSocketConnected() {
  if (!socket.connected) {
    await new Promise<void>((resolve, reject) => {
      const handleConnect = () => {
        cleanup();
        resolve();
      };

      const handleConnectError = (err: unknown) => {
        cleanup();
        console.error("Failed to connect socket:", err);
        reject(err);
      };

      const cleanup = () => {
        socket.off("connect", handleConnect);
        socket.off("connect_error", handleConnectError);
      };

      socket.once("connect", handleConnect);
      socket.once("connect_error", handleConnectError);
      socket.connect();
    });
  }
}

export async function createMatchRoom(
  displayName: string,
  roundsTotal = 3,
): Promise<string> {
  const res = await getState();

  if (!res.ok) throw new Error("USER_ALREADY_IN_GAME");

  await ensureEnoughSongsForMatch();
  await ensureSocketConnected();

  let matchId = "";

  await new Promise<void>((resolve, reject) => {
    const handleCreated = (payload: { matchId: string }) => {
      if (payload.matchId) {
        matchId = payload.matchId;
        cleanup();
        resolve();
      }
    };

    const handleError = (payload: { message?: string }) => {
      cleanup();
      reject(new Error(payload.message || "MATCH_CREATE_FAILED"));
    };

    const cleanup = () => {
      socket.off("match:created", handleCreated);
      socket.off("match:error", handleError);
    };

    socket.on("match:created", handleCreated);
    socket.on("match:error", handleError);

    socket.emit("match:create", {
      displayName,
      roundsTotal,
    });
  });

  return matchId;
}
