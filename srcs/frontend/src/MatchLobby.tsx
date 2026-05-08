import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";

type MatchPhase = "lobby" | "countdown";

type MatchState = {
  matchId: string;
  expectedPlayers: number;
  phase: MatchPhase;
  players: Array<{
    playerId: string;
    playerName: string;
    ready: boolean;
  }>;
};

type MatchCountdownPayload = {
  seconds: number;
};

type MatchErrorPayload = {
  message: string;
};

const GAME_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL ?? "";

const randomPlayerId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `player-${Math.random().toString(36).slice(2, 10)}`;
};

function getStoredPlayerId(): string {
  const storageKey = "songuess-player-id";
  const storedId = window.localStorage.getItem(storageKey);

  if (storedId) {
    return storedId;
  }

  const newId = randomPlayerId();
  window.localStorage.setItem(storageKey, newId);
  return newId;
}

export function MatchLobby() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("Player One");
  const [matchId, setMatchId] = useState("");
  const [expectedPlayers, setExpectedPlayers] = useState(2);

  const playerId = useMemo(() => getStoredPlayerId(), []);

  useEffect(() => {
    const client = io(GAME_GATEWAY_URL, {
      autoConnect: false,
      path: "/api/game/socket.io",
      withCredentials: true,
    });

    client.on("connect", () => {
      setConnected(true);
      setError(null);
    });

    client.on("disconnect", () => {
      setConnected(false);
    });

    client.on("match:state", (payload: MatchState) => {
      setMatch(payload);
      setMatchId(payload.matchId);
    });

    client.on("match:created", (payload: MatchState) => {
      setMatch(payload);
      setMatchId(payload.matchId);
      setCountdown(null);
    });

    client.on("match:joined", (payload: MatchState) => {
      setMatch(payload);
      setMatchId(payload.matchId);
      setCountdown(null);
    });

    client.on("match:countdown", (payload: MatchCountdownPayload) => {
      setCountdown(payload.seconds);
    });

    client.on("match:error", (payload: MatchErrorPayload) => {
      setError(payload.message);
    });

    client.connect();
    setSocket(client);

    return () => {
      client.disconnect();
      setSocket(null);
    };
  }, []);

  const emitMatchCreate = () => {
    if (!socket) return;

    setError(null);
    socket.emit("match:create", {
      matchId: matchId.trim() || undefined,
      playerId,
      playerName: playerName.trim() || "Player One",
      expectedPlayers,
    });
  };

  const emitMatchJoin = () => {
    if (!socket) return;

    const cleanMatchId = matchId.trim();

    if (!cleanMatchId) {
      setError("Match id is required to join a room.");
      return;
    }

    setError(null);
    socket.emit("match:join", {
      matchId: cleanMatchId,
      playerId,
      playerName: playerName.trim() || "Player One",
    });
  };

  const emitReady = () => {
    if (!socket) return;

    setError(null);
    socket.emit("match:ready");
  };

  const currentPlayers = match?.players ?? [];

  return (
    <aside className="lobby-card">
      <div className="lobby-header">
        <div>
          <p className="eyebrow">Game service</p>
          <h2>Match control</h2>
        </div>
        <span className={`connection-pill ${connected ? "on" : "off"}`}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="field-grid">
        <label>
          Player name
          <input
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Player One"
          />
        </label>
        <label>
          Match id
          <input
            value={matchId}
            onChange={(event) => setMatchId(event.target.value)}
            placeholder="Leave blank to create a new room"
          />
        </label>
        <label>
          Expected players
          <input
            type="number"
            min={2}
            max={8}
            value={expectedPlayers}
            onChange={(event) =>
              setExpectedPlayers(Math.max(2, Number(event.target.value) || 2))
            }
          />
        </label>
      </div>

      <div className="button-row">
        <button type="button" onClick={emitMatchCreate} disabled={!connected}>
          Create match
        </button>
        <button type="button" onClick={emitMatchJoin} disabled={!connected}>
          Join match
        </button>
        <button type="button" onClick={emitReady} disabled={!connected || !match}>
          Ready up
        </button>
      </div>

      <div className="match-summary">
        <div>
          <span>Room</span>
          <strong>{match?.matchId ?? "No match yet"}</strong>
        </div>
        <div>
          <span>Phase</span>
          <strong>{match?.phase ?? "lobby"}</strong>
        </div>
        <div>
          <span>Countdown</span>
          <strong>{countdown ?? "Waiting"}</strong>
        </div>
      </div>

      <section className="roster">
        <h3>Players</h3>
        {currentPlayers.length === 0 ? (
          <p className="empty-state">No players in the room yet.</p>
        ) : (
          <ul>
            {currentPlayers.map((player) => (
              <li key={player.playerId}>
                <div>
                  <strong>{player.playerName}</strong>
                  <span>{player.playerId === playerId ? "You" : player.playerId}</span>
                </div>
                <span className={`ready-chip ${player.ready ? "ready" : "not-ready"}`}>
                  {player.ready ? "Ready" : "Not ready"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? <p className="error-banner">{error}</p> : null}
    </aside>
  );
}
