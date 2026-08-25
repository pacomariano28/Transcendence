import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/auth-context";
import { socket } from "../api/socket";
import TypingText from "../components/TypingText";
import LobbyPlaylistPicker from "../components/LobbyPlaylistPicker";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";
import { getMatchState } from "../api/state";
import { fetchMySpotifyPlaylists } from "../api/spotifyPlaylists";
import NotFoundPage from "./NotFoundPage";
import type {
  LobbyPlaylistOption,
  MatchPhasePayload,
  MatchStatePayload,
  RoomLobbyLocationState,
} from "../types/socket.payloads";
import { translateError } from "../i18n/translateError";
import i18n from "../i18n/i18n";

import {
  GENRE_PLAYLISTS,
  SYSTEM_PLAYLIST_OWNER_ID,
  isSystemGenrePlaylist,
} from "../constants/genrePlaylists";
import {
  LOCAL_SEED_PLAYLIST,
  isLocalSeedPlaylist,
} from "../constants/localPlaylist";

function normalizeCode(raw: string) {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function isMatchNotFoundError(message: string) {
  return message === "MATCH_NOT_FOUND";
}

export default function RoomLobbyPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const locationState = location.state as RoomLobbyLocationState | null;
  const createdMatch = locationState?.createdMatch;

  const nav = useNavigate();
  const { code: codeParam } = useParams();
  const { user } = useAuth();

  const code = useMemo(() => normalizeCode(codeParam ?? ""), [codeParam]);

  const [matchState, setMatchState] = useState<MatchStatePayload | null>(
    createdMatch ?? null,
  );

  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlistLoadError, setPlaylistLoadError] = useState<string | null>(
    null,
  );
  const navigatingToMatchRef = useRef(false);
  const sharedPlaylistsRef = useRef(false);

  function leaveLobby() {
    if (!socket.connected) return;
    socket.emit("match:leave");
  }

  const me = useMemo(() => {
    if (!matchState || !user) return null;
    const userId = String(user.id);
    return matchState.players.find((p) => p.userId === userId);
  }, [matchState, user]);

  const isHost = Boolean(
    matchState?.hostUserId && user && matchState.hostUserId === String(user.id),
  );

  const connectedPlayers = useMemo(() => {
    if (!matchState) return [];
    return matchState.players.filter((player) => player.connected);
  }, [matchState]);

  const playlistOptions = useMemo(() => {
    const shared = matchState?.availablePlaylists ?? [];
    const selected = matchState?.selectedPlaylist;

    const genreOptions: LobbyPlaylistOption[] = GENRE_PLAYLISTS.map((genre) => {
      const selectedCover =
        selected?.id === genre.id ? (selected.imageUrl ?? null) : null;
      return {
        id: genre.id,
        name: t(`lobby.genres.${genre.genreKey}`, { defaultValue: genre.name }),
        imageUrl: selectedCover,
        trackCount: 0,
        ownerUserId: SYSTEM_PLAYLIST_OWNER_ID,
        ownerDisplayName: "Spotify",
      };
    });

    const localOption: LobbyPlaylistOption = {
      id: LOCAL_SEED_PLAYLIST.id,
      name: t(LOCAL_SEED_PLAYLIST.nameKey, {
        defaultValue: LOCAL_SEED_PLAYLIST.defaultName,
      }),
      imageUrl: LOCAL_SEED_PLAYLIST.imageUrl,
      trackCount: 0,
      ownerUserId: LOCAL_SEED_PLAYLIST.ownerUserId,
      ownerDisplayName: LOCAL_SEED_PLAYLIST.ownerDisplayName,
    };

    return [localOption, ...genreOptions, ...shared];
  }, [matchState?.availablePlaylists, matchState?.selectedPlaylist, t]);

  const selectedPlaylist = matchState?.selectedPlaylist ?? null;

  const selectedImageUrl = useMemo(() => {
    if (!selectedPlaylist) return null;
    if (selectedPlaylist.imageUrl) return selectedPlaylist.imageUrl;
    const match = playlistOptions.find(
      (option) =>
        option.id === selectedPlaylist.id &&
        (isSystemGenrePlaylist(option.id) ||
          isLocalSeedPlaylist(option.id) ||
          option.ownerUserId === selectedPlaylist.ownerUserId),
    );
    return match?.imageUrl ?? null;
  }, [playlistOptions, selectedPlaylist]);

  const playlistReady =
    matchState?.playlistPrepStatus === "ready" && Boolean(selectedPlaylist);

  useEffect(() => {
    setNotFound(false);

    if (!code) {
      setNotFound(true);
      return;
    }

    if (createdMatch?.matchId === code) return;

    async function validateRoom() {
      try {
        const match = await getMatchState({ matchId: code });
        if (match.phase === "finished") {
          setNotFound(true);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (isMatchNotFoundError(message)) {
          setNotFound(true);
        }
      }
    }

    validateRoom();
  }, [code, createdMatch]);

  useEffect(() => {
    if (!user || !code || notFound) return;

    navigatingToMatchRef.current = false;
    sharedPlaylistsRef.current = false;

    if (!socket.connected) {
      socket.connect();
    }

    const joinMatch = () => {
      socket.emit("match:join", {
        matchId: code,
        displayName:
          user.username ?? user.email ?? i18n.t("lobby.guestFallback"),
      });
    };

    if (socket.connected) {
      joinMatch();
    }

    socket.on("connect", joinMatch);

    socket.on("match:state", (payload: MatchStatePayload) => {
      setMatchState(payload);
      setError(null);

      if (payload.phase === "in-game") {
        navigatingToMatchRef.current = true;
        nav(`/match/${code}`, { replace: true });
      }
    });

    socket.on("match:phase", (payload: MatchPhasePayload) => {
      if (payload.matchId !== code) return;
      setMatchState((prev) =>
        prev ? { ...prev, phase: payload.phase } : prev,
      );
      setError(null);
      if (payload.phase === "in-game") {
        navigatingToMatchRef.current = true;
        nav(`/match/${code}`, { replace: true });
      }
    });

    socket.on("match:error", (err: { message: string }) => {
      if (isMatchNotFoundError(err.message)) {
        setNotFound(true);
        return;
      }
      setError(err.message);
    });

    return () => {
      socket.off("connect", joinMatch);
      socket.off("match:state");
      socket.off("match:phase");
      socket.off("match:error");

      if (!navigatingToMatchRef.current) {
        leaveLobby();
      }
    };
  }, [code, user, nav, createdMatch, notFound]);

  useEffect(() => {
    if (!user || !matchState || matchState.phase !== "lobby") return;
    if (sharedPlaylistsRef.current) return;
    if (!socket.connected) return;

    sharedPlaylistsRef.current = true;

    async function share() {
      try {
        if (!user?.spotifyProfile?.hasSpotifyTokens) {
          socket.emit("match:share_playlists", { playlists: [] });
          return;
        }
        const playlists = await fetchMySpotifyPlaylists();
        socket.emit("match:share_playlists", {
          playlists: playlists.map((p) => ({
            id: p.id,
            name: p.name,
            imageUrl: p.imageUrl,
            trackCount: p.trackCount,
          })),
        });
        setPlaylistLoadError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "PLAYLIST_LOAD_FAILED";
        setPlaylistLoadError(message);
        socket.emit("match:share_playlists", { playlists: [] });
      }
    }

    share();
  }, [user, matchState?.matchId, matchState?.phase]);

  function toggleReady() {
    if (!playlistReady) {
      setError("PLAYLIST_NOT_READY");
      return;
    }
    socket.emit("match:ready");
  }

  function leave() {
    leaveLobby();
    nav("/play", { replace: true });
  }

  function onSelectPlaylist(option: LobbyPlaylistOption) {
    if (!isHost) return;
    socket.emit("match:select_playlist", {
      playlistId: option.id,
      ownerUserId: option.ownerUserId || String(user?.id ?? ""),
      name: option.name,
      imageUrl: option.imageUrl,
      ownerDisplayName: option.ownerDisplayName,
      kind: option.kind === "album" ? "album" : "playlist",
    });
  }

  if (!code || notFound) {
    return <NotFoundPage title={t("lobby.notFoundTitle")} />;
  }

  return (
    <div className="container-page py-10 mt-5">
      <div className="mx-auto max-w-3xl">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
            <TypingText
              text={t("lobby.lobbyCode")}
              size="md"
              className="ms-1"
            />
          </div>
          <div className="select-text mt-3 font-mono text-4xl font-semibold tracking-[0.35em] text-white sm:text-5xl">
            {code || "———"}
          </div>

          <LobbyPlaylistPicker
            options={playlistOptions}
            selected={selectedPlaylist}
            selectedImageUrl={selectedImageUrl}
            prepStatus={matchState?.playlistPrepStatus ?? "idle"}
            prepReady={matchState?.playlistPrepReady ?? 0}
            prepNeeded={matchState?.playlistPrepNeeded ?? 0}
            prepError={matchState?.playlistPrepError ?? null}
            isHost={isHost}
            onSelect={onSelectPlaylist}
          />

          {playlistLoadError && (
            <div className="mt-3 text-xs text-amber-200/90">
              {t("lobby.playlistShareFailed")}{" "}
              <a className="underline" href="/api/auth/spotify/login">
                {t("lobby.reauthSpotify")}
              </a>
            </div>
          )}

          <div className="mt-6 flex gap-3 sm:flex-row">
            <button
              className="btn-glow flex-5 p-4"
              style={
                {
                  "--btn-color": me?.ready ? "#4ade80" : "#f7d046",
                } as React.CSSProperties
              }
              type="button"
              onClick={toggleReady}
              onMouseMove={handleMouseMoveToSetFillOrigin}
              disabled={!matchState || !playlistReady}
            >
              <span>{me?.ready ? t("lobby.ready") : t("lobby.markReady")}</span>
            </button>
            <button className="btn-ghost flex-1" type="button" onClick={leave}>
              {t("lobby.leaveRoom")}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 nudge mt-4">
              <strong>{t("lobby.errorPrefix")}</strong>{" "}
              {translateError(error, t)}
            </div>
          )}

          <div className="mt-8 page-card">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                {t("lobby.connectedPlayers")}
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                {matchState ? connectedPlayers.length : 0}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {connectedPlayers.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                  {t("lobby.waitingPlayers")}
                </div>
              ) : (
                connectedPlayers.map((player) => (
                  <div
                    key={player.userId}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-zinc-100">
                        {player.displayName}
                        {player.userId === matchState?.hostUserId ? (
                          <span className="text-zinc-500">
                            {t("lobby.hostSuffix")}
                          </span>
                        ) : null}
                        {player.userId === String(user?.id) ? (
                          <span className="text-zinc-500">
                            {t("lobby.youSuffix")}
                          </span>
                        ) : null}
                      </div>
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          player.ready ? "bg-emerald-400" : "bg-rose-400"
                        }`}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
