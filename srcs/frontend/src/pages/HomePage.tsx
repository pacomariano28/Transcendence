import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/auth-context";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";
import TypingText from "../components/TypingText";
import CreditsCarousel from "../components/CreditsCarousel";
import { socket } from "../api/socket";
import { getState } from "../api/state";
import {
  ensureEnoughSongsForMatch,
  getAvailableSongCount,
  MATCH_ROUNDS_TOTAL,
} from "../api/playlist";
import { translateError } from "../i18n/translateError";
import i18n from "../i18n/i18n";

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

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");
  const [songsAvailable, setSongsAvailable] = useState<number | null>(null);

  const hasEnoughSongs =
    songsAvailable === null || songsAvailable >= MATCH_ROUNDS_TOTAL;

  useEffect(() => {
    let cancelled = false;

    async function loadAvailableSongs() {
      try {
        const count = await getAvailableSongCount();
        if (!cancelled) {
          setSongsAvailable(count);
        }
      } catch {
        if (!cancelled) {
          setSongsAvailable(null);
        }
      }
    }

    loadAvailableSongs();

    return () => {
      cancelled = true;
    };
  }, []);

  const disabledReason = useMemo(() => {
    if (!user) return t("home.disabled_login_required");
    if (isCreating) return t("home.disabled_creating");
    if (songsAvailable !== null && !hasEnoughSongs) {
      return t("errors.NOT_ENOUGH_SONGS_MESSAGE");
    }
    return "";
  }, [user, isCreating, songsAvailable, hasEnoughSongs, t]);

  async function createRoom() {
    if (!user || isCreating || !hasEnoughSongs) return;

    setIsCreating(true);
    setError("");

    try {
      const res = await getState();

      if (!res.ok) throw new Error("USER_ALREADY_IN_GAME");

      await ensureEnoughSongsForMatch();
      await ensureSocketConnected();

      let matchId = "";
      const playerName =
        user.username ?? user.email ?? i18n.t("match.user.guest");

      await new Promise<void>((resolve, reject) => {
        const handleCreated = (payload: { matchId: string }) => {
          console.log("Event received: match:created", payload);
          if (payload.matchId) {
            matchId = payload.matchId;
            cleanup();
            resolve();
          }
        };

        const handleError = (payload: { message?: string }) => {
          console.error("Event received: match:error", payload);
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
          displayName: playerName,
          roundsTotal: 3,
        });
      });

      navigate(`/room/${matchId}`);
    } catch (err) {
      console.error("Error creating room:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCreating(false);
    }
  }

  async function joinRoom() {
    if (!user || isCreating || !hasEnoughSongs) return;

    setIsCreating(true);
    setError("");

    try {
      const res = await getState();

      if (!res.ok) throw new Error("USER_ALREADY_IN_GAME");

      await ensureEnoughSongsForMatch();

      navigate(`/join`);
    } catch (err) {
      console.error("Error joining room:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="container-page grid min-h-[calc(100dvh-9rem)] w-full grid-rows-[1fr_auto_1fr]">
      <div className="flex flex-col justify-end pb-6 sm:pb-8">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <h1 className="page-title">{t("home.title")}</h1>
          <TypingText text="SONGUESS" size="md" className="mx-auto ms-1" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <div className="w-full">
          <div className="section-stack">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="btn-glow w-full sm:flex-1 p-10"
                style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
                onMouseMove={handleMouseMoveToSetFillOrigin}
                onClick={createRoom}
                disabled={!user || isCreating || !hasEnoughSongs}
                title={disabledReason}
              >
                <span>
                  {isCreating ? t("home.creating") : t("home.create_room")}
                </span>
              </button>

              <button
                type="button"
                className="btn-glow w-full sm:flex-1 p-10"
                style={{ "--btn-color": "#ede9db" } as React.CSSProperties}
                onMouseMove={handleMouseMoveToSetFillOrigin}
                onClick={joinRoom}
                disabled={!user || isCreating || !hasEnoughSongs}
                title={disabledReason}
              >
                <span>{t("home.join_room")}</span>
              </button>
            </div>

            {(error || (songsAvailable !== null && !hasEnoughSongs)) && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 nudge">
                <strong>
                  {error
                    ? translateError(error, t)
                    : t("errors.NOT_ENOUGH_SONGS_MESSAGE")}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center pt-5">
        <CreditsCarousel />
      </div>
    </div>
  );
}
