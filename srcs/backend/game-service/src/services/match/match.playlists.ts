/**
 * Lobby playlist selection: genre catalogs, shared player playlists, materialize clips.
 */
import {
  fetchUserPlaylistMeta,
  fetchUserPlaylistTracks,
} from "../../clients/auth.client.js";
import {
  fetchPublicAlbum,
  fetchPublicAlbumTracks,
  fetchPublicPlaylist,
} from "../../clients/content.client.js";
import {
  ensureSongs,
  fetchSeedSongs,
  fetchSongsStatus,
} from "../../clients/playlist.client.js";
import {
  CLIP_PREP_POLL_MS,
  CLIP_PREP_TIMEOUT_MS,
  LOCAL_SEED_PLAYLIST,
  SYSTEM_PLAYLIST_OWNER_ID,
  getGenrePlaylist,
  isLocalSeedPlaylist,
  isSystemGenrePlaylist,
} from "../../utils/constants.js";
import {
  getMatchBySocketOrThrow,
  type MatchRegistry,
} from "./match.registry.js";

function toLobbyPayload(match: MatchState) {
  return {
    matchId: match.matchId,
    roundsTotal: match.roundsTotal,
    phase: match.phase,
    hostUserId: match.hostUserId,
    players: match.players.map((player) => ({
      userId: player.userId,
      displayName: player.displayName,
      ready: player.ready,
      connected: player.connected,
      disconnectedAt: player.disconnectedAt,
    })),
    availablePlaylists: match.availablePlaylists,
    selectedPlaylist: match.selectedPlaylist,
    playlistPrepStatus: match.playlistPrepStatus,
    playlistPrepReady: match.playlistPrepReady,
    playlistPrepNeeded: match.playlistPrepNeeded,
    playlistPrepError: match.playlistPrepError,
  };
}

const prepTokens = new Map<string, number>();

function fisherYatesShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickPreparedSongs(
  readySongs: Array<{
    isrc: string;
    fileName: string | null;
    title?: string | null;
    artist?: string | null;
  }>,
  roundsTotal: number,
): Array<{ isrc: string; fileName: string; title?: string; artist?: string }> {
  const playable = readySongs.filter(
    (song): song is typeof song & { fileName: string } => Boolean(song.fileName),
  );
  const shuffled = fisherYatesShuffle(playable);
  const take = Math.min(
    shuffled.length,
    Math.max(roundsTotal, Math.min(5, shuffled.length)),
  );
  return shuffled.slice(0, take).map(({ isrc, fileName, title, artist }) => ({
    isrc,
    fileName,
    ...(title ? { title } : {}),
    ...(artist ? { artist } : {}),
  }));
}

async function applyLocalSeedLibrary(
  match: MatchState,
  emit: EmitMatchEvent,
): Promise<boolean> {
  const seedResult = await fetchSeedSongs(Math.max(match.roundsTotal, 5));
  if (!seedResult.ok || seedResult.songs.length === 0) {
    return false;
  }

  match.selectedPlaylist = {
    id: LOCAL_SEED_PLAYLIST.id,
    name: LOCAL_SEED_PLAYLIST.name,
    ownerUserId: SYSTEM_PLAYLIST_OWNER_ID,
    ownerDisplayName: LOCAL_SEED_PLAYLIST.ownerDisplayName,
    imageUrl: match.selectedPlaylist?.imageUrl ?? null,
    kind: "playlist",
  };
  match.preparedSongs = pickPreparedSongs(seedResult.songs, match.roundsTotal);
  match.playlistPrepReady = match.preparedSongs.length;
  match.playlistPrepNeeded = match.roundsTotal;
  match.playlistPrepStatus = "ready";
  match.playlistPrepError = null;
  emitLobbyState(emit, match);
  return true;
}

function clearPlayerReady(match: MatchState): void {
  for (const player of match.players) {
    player.ready = false;
  }
}

function clearPlaylistSelection(match: MatchState): void {
  match.selectedPlaylist = null;
  match.playlistPrepStatus = "idle";
  match.playlistPrepReady = 0;
  match.playlistPrepNeeded = match.roundsTotal;
  match.playlistPrepError = null;
  match.preparedSongs = [];
  match.playlist = [];
  match.playlistError = null;
}

export function startPlaylistPreparation(
  registry: MatchRegistry,
  matchId: string,
  emit: EmitMatchEvent,
): void {
  const match = registry.matches.get(matchId);
  if (!match?.selectedPlaylist || match.phase !== "lobby") return;

  const prepToken = Date.now();
  prepTokens.set(matchId, prepToken);
  match.playlistPrepStatus = "loading";
  match.playlistPrepReady = 0;
  match.playlistPrepError = null;
  void materializeSelectedPlaylist(registry, matchId, prepToken, emit);
}

export function applyPreviousPlaylistForRematch(
  match: MatchState,
  previous: SelectedLobbyPlaylist | null,
): void {
  if (!previous) {
    clearPlaylistSelection(match);
    return;
  }

  match.selectedPlaylist = {
    id: previous.id,
    name: previous.name,
    ownerUserId: previous.ownerUserId,
    ownerDisplayName: previous.ownerDisplayName,
    imageUrl: previous.imageUrl ?? null,
    kind: previous.kind ?? "playlist",
  };
  match.playlistPrepStatus = "loading";
  match.playlistPrepReady = 0;
  match.playlistPrepNeeded = match.roundsTotal;
  match.playlistPrepError = null;
  match.preparedSongs = [];
  match.playlist = [];
  match.playlistError = null;
}

export function sharePlaylists(
  registry: MatchRegistry,
  socketId: string,
  playlists: Array<{
    id: string;
    name: string;
    imageUrl?: string | null;
    trackCount?: number;
  }>,
): MatchState {
  const match = getMatchBySocketOrThrow(registry, socketId);
  if (match.phase !== "lobby") {
    throw new Error("INVALID_STATE");
  }

  const player = match.players.find((entry) => entry.socketId === socketId);
  if (!player) {
    throw new Error("PLAYER_NOT_IN_MATCH");
  }

  match.availablePlaylists = match.availablePlaylists.filter(
    (entry) => entry.ownerUserId !== player.userId,
  );

  for (const playlist of playlists) {
    if (!playlist?.id || !playlist?.name) continue;
    if (isSystemGenrePlaylist(playlist.id)) continue;
    if (isLocalSeedPlaylist(playlist.id)) continue;

    match.availablePlaylists.push({
      id: playlist.id,
      name: playlist.name,
      imageUrl: playlist.imageUrl ?? null,
      trackCount: playlist.trackCount ?? 0,
      ownerUserId: player.userId,
      ownerDisplayName: player.displayName,
    });
  }

  return match;
}

export function clearPlaylistsForUser(
  match: MatchState,
  userId: string,
): { clearedSelection: boolean } {
  match.availablePlaylists = match.availablePlaylists.filter(
    (entry) => entry.ownerUserId !== userId,
  );

  let clearedSelection = false;

  if (
    match.selectedPlaylist?.ownerUserId === userId &&
    match.selectedPlaylist.ownerUserId !== SYSTEM_PLAYLIST_OWNER_ID
  ) {
    clearPlaylistSelection(match);
    clearPlayerReady(match);
    clearedSelection = true;
  }

  if (match.hostUserId === userId) {
    const nextHost = match.players.find(
      (p) => p.connected && p.userId !== userId,
    );
    if (nextHost) {
      match.hostUserId = nextHost.userId;
    }
  }

  return { clearedSelection };
}

export async function selectPlaylist(
  registry: MatchRegistry,
  socketId: string,
  input: {
    playlistId: string;
    ownerUserId: string;
    name?: string;
    imageUrl?: string | null;
    ownerDisplayName?: string;
    kind?: "playlist" | "album";
  },
  emit: EmitMatchEvent,
): Promise<MatchState> {
  const match = getMatchBySocketOrThrow(registry, socketId);
  if (match.phase !== "lobby") {
    throw new Error("INVALID_STATE");
  }

  const player = match.players.find((entry) => entry.socketId === socketId);
  if (!player) {
    throw new Error("PLAYER_NOT_IN_MATCH");
  }

  if (player.userId !== match.hostUserId) {
    throw new Error("NOT_HOST");
  }

  clearPlayerReady(match);
  match.playlist = [];
  match.playlistError = null;
  match.preparedSongs = [];

  const kind = input.kind === "album" ? "album" : "playlist";
  const isLocalSelection = isLocalSeedPlaylist(input.playlistId);
  const isSystemSelection =
    isLocalSelection ||
    kind === "album" ||
    isSystemGenrePlaylist(input.playlistId) ||
    input.ownerUserId === SYSTEM_PLAYLIST_OWNER_ID;

  if (isSystemSelection) {
    const genre =
      kind === "playlist" && !isLocalSelection
        ? getGenrePlaylist(input.playlistId)
        : undefined;
    match.selectedPlaylist = {
      id: input.playlistId,
      name:
        input.name ??
        (isLocalSelection
          ? LOCAL_SEED_PLAYLIST.name
          : (genre?.name ?? (kind === "album" ? "Album" : "Playlist"))),
      ownerUserId: SYSTEM_PLAYLIST_OWNER_ID,
      ownerDisplayName: isLocalSelection
        ? LOCAL_SEED_PLAYLIST.ownerDisplayName
        : genre
          ? "Spotify"
          : (input.ownerDisplayName ?? "Spotify"),
      imageUrl: input.imageUrl ?? null,
      kind,
    };
  } else {
    const option = match.availablePlaylists.find(
      (entry) =>
        entry.id === input.playlistId &&
        entry.ownerUserId === input.ownerUserId,
    );

    if (!option) {
      throw new Error("PLAYLIST_NOT_AVAILABLE");
    }

    match.selectedPlaylist = {
      id: option.id,
      name: option.name,
      ownerUserId: option.ownerUserId,
      ownerDisplayName: option.ownerDisplayName,
      imageUrl: option.imageUrl,
      kind: "playlist",
    };
  }

  match.playlistPrepStatus = "loading";
  match.playlistPrepReady = 0;
  match.playlistPrepNeeded = match.roundsTotal;
  match.playlistPrepError = null;

  const prepToken = Date.now();
  prepTokens.set(match.matchId, prepToken);
  emit(match.matchId, "match:state", toLobbyPayload(match));

  if (isLocalSelection) {
    await materializeSelectedPlaylist(registry, match.matchId, prepToken, emit);
    return getMatchBySocketOrThrow(registry, socketId);
  }

  void materializeSelectedPlaylist(registry, match.matchId, prepToken, emit);

  return match;
}

async function materializeSelectedPlaylist(
  registry: MatchRegistry,
  matchId: string,
  prepToken: number,
  emit: EmitMatchEvent,
): Promise<void> {
  const match = registry.matches.get(matchId);
  if (!match || prepTokens.get(matchId) !== prepToken) return;
  if (!match.selectedPlaylist) return;

  const selected = match.selectedPlaylist;
  const isLocalLibrary = isLocalSeedPlaylist(selected.id);

  if (isLocalLibrary) {
    if (prepTokens.get(matchId) !== prepToken) return;

    const applied = await applyLocalSeedLibrary(match, emit);
    if (!applied) {
      match.playlistPrepStatus = "error";
      match.playlistPrepError = "NOT_ENOUGH_SONGS_AVAILABLE";
      emitLobbyState(emit, match);
    }
    return;
  }

  const isAlbum = selected.kind === "album";
  const isSystemOwned =
    isAlbum ||
    selected.ownerUserId === SYSTEM_PLAYLIST_OWNER_ID ||
    isSystemGenrePlaylist(selected.id);

  let tracks: Array<{
    spotifyTrackId: string;
    name: string;
    artists: string;
    isrc: string | null;
  }> = [];
  let lastError = "SPOTIFY_NOT_LINKED";

  if (isAlbum) {
    const meta = await fetchPublicAlbum(selected.id);
    if (meta.ok && prepTokens.get(matchId) === prepToken) {
      match.selectedPlaylist = {
        ...selected,
        name: meta.album.name || selected.name,
        imageUrl: meta.album.imageUrl ?? selected.imageUrl ?? null,
        ownerDisplayName:
          meta.album.ownerName ?? selected.ownerDisplayName,
        kind: "album",
      };
      emitLobbyState(emit, match);
    }

    const tracksResult = await fetchPublicAlbumTracks(selected.id, 50);
    if (tracksResult.ok && tracksResult.tracks.length > 0) {
      tracks = tracksResult.tracks;
      lastError = "";
    } else if (tracksResult.ok === false) {
      lastError = tracksResult.error;
    } else {
      lastError = "PLAYLIST_NO_ISRC_TRACKS";
    }
  } else if (isSystemOwned) {
    // Playlist track lists are not available with Client Credentials (Spotify
    // returns 403). Metadata may still work; tracks come from user OAuth below.
    const meta = await fetchPublicPlaylist(selected.id);
    if (meta.ok && prepTokens.get(matchId) === prepToken) {
      const genre = getGenrePlaylist(selected.id);
      match.selectedPlaylist = {
        ...selected,
        name: genre?.name ?? meta.playlist.name ?? selected.name,
        imageUrl: meta.playlist.imageUrl ?? selected.imageUrl ?? null,
        ownerDisplayName: genre
          ? "Spotify"
          : (meta.playlist.ownerName ?? selected.ownerDisplayName),
        kind: "playlist",
      };
      emitLobbyState(emit, match);
    }
  }

  const tokenUserIds: string[] = [];
  if (!isAlbum) {
    if (isSystemOwned) {
      tokenUserIds.push(match.hostUserId);
      for (const player of match.players) {
        if (player.userId !== match.hostUserId) {
          tokenUserIds.push(player.userId);
        }
      }
    } else {
      tokenUserIds.push(selected.ownerUserId);
      if (selected.ownerUserId !== match.hostUserId) {
        tokenUserIds.push(match.hostUserId);
      }
    }
  }

  for (const tokenUserId of tokenUserIds) {
    if (tracks.length > 0) break;

    const meta = await fetchUserPlaylistMeta(tokenUserId, selected.id);
    if (meta.ok && prepTokens.get(matchId) === prepToken) {
      const genre = getGenrePlaylist(selected.id);
      match.selectedPlaylist = {
        ...selected,
        name: isSystemOwned
          ? (genre?.name ?? meta.playlist.name)
          : meta.playlist.name || selected.name,
        imageUrl: meta.playlist.imageUrl ?? selected.imageUrl ?? null,
        ownerDisplayName: genre
          ? "Spotify"
          : isSystemOwned
            ? (meta.playlist.ownerName ?? selected.ownerDisplayName)
            : selected.ownerDisplayName,
        kind: "playlist",
      };
      emitLobbyState(emit, match);
    }

    const tracksResult = await fetchUserPlaylistTracks(
      tokenUserId,
      selected.id,
    );
    if (tracksResult.ok && tracksResult.tracks.length > 0) {
      tracks = tracksResult.tracks;
      lastError = "";
      break;
    }
    if (tracksResult.ok === false) {
      lastError = tracksResult.error;
    } else if (tracksResult.ok && tracksResult.tracks.length === 0) {
      lastError = "PLAYLIST_NO_ISRC_TRACKS";
    }
  }

  if (!tracks.length) {
    if (prepTokens.get(matchId) !== prepToken) return;

    const fallbackApplied = await applyLocalSeedLibrary(match, emit);
    if (fallbackApplied) return;

    match.playlistPrepStatus = "error";
    match.playlistPrepError =
      lastError === "SPOTIFY_NOT_LINKED" ||
      lastError === "SPOTIFY_NOT_CONFIGURED" ||
      lastError === "SPOTIFY_PLAYLIST_FORBIDDEN" ||
      lastError === "ERROR_FETCHING_DATA_FROM_SPOTIFY"
        ? "SPOTIFY_NOT_LINKED"
        : lastError || "SPOTIFY_PLAYLIST_TRACKS_FAILED";
    emitLobbyState(emit, match);
    return;
  }

  const withIsrc = tracks.filter(
    (track): track is typeof track & { isrc: string } => Boolean(track.isrc),
  );

  if (withIsrc.length === 0) {
    if (prepTokens.get(matchId) !== prepToken) return;
    match.playlistPrepStatus = "error";
    match.playlistPrepError = "PLAYLIST_NO_ISRC_TRACKS";
    emitLobbyState(emit, match);
    return;
  }

  const ensureResult = await ensureSongs(
    withIsrc.map((track) => ({
      isrc: track.isrc,
      title: track.name,
      artist: track.artists,
      spotifyTrackId: track.spotifyTrackId,
    })),
  );

  if (!ensureResult.ok) {
    if (prepTokens.get(matchId) !== prepToken) return;
    match.playlistPrepStatus = "error";
    match.playlistPrepError = ensureResult.error;
    emitLobbyState(emit, match);
    return;
  }

  const candidateIsrcs = withIsrc.map((t) => t.isrc);
  const startedAt = Date.now();

  while (Date.now() - startedAt < CLIP_PREP_TIMEOUT_MS) {
    if (prepTokens.get(matchId) !== prepToken) return;

    const status = await fetchSongsStatus(candidateIsrcs);
    if (!status.ok) {
      match.playlistPrepStatus = "error";
      match.playlistPrepError = status.error;
      emitLobbyState(emit, match);
      return;
    }

    const readySongs = status.results.filter(
      (r) => r.status === "ready" && r.fileName,
    );
    match.playlistPrepReady = readySongs.length;
    match.playlistPrepNeeded = Math.max(
      candidateIsrcs.length,
      match.roundsTotal,
    );
    emitLobbyState(emit, match);

    if (readySongs.length >= match.roundsTotal) {
      match.preparedSongs = pickPreparedSongs(readySongs, match.roundsTotal);
      match.playlistPrepStatus = "ready";
      match.playlistPrepError = null;
      emitLobbyState(emit, match);
      return;
    }

    const stillPending = status.results.some((r) => r.status === "pending");
    if (!stillPending) {
      if (readySongs.length > 0) {
        match.preparedSongs = pickPreparedSongs(readySongs, match.roundsTotal);
        match.playlistPrepStatus = "ready";
        match.playlistPrepError = null;
        match.playlistPrepReady = readySongs.length;
        emitLobbyState(emit, match);
        return;
      }

      match.playlistPrepStatus = "error";
      match.playlistPrepError = "PLAYLIST_NOT_ENOUGH_PLAYABLE_SONGS";
      emitLobbyState(emit, match);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, CLIP_PREP_POLL_MS));
  }

  if (prepTokens.get(matchId) !== prepToken) return;

  const finalStatus = await fetchSongsStatus(candidateIsrcs);
  if (finalStatus.ok) {
    const readySongs = finalStatus.results.filter(
      (r) => r.status === "ready" && r.fileName,
    );
    if (readySongs.length > 0) {
      match.preparedSongs = pickPreparedSongs(readySongs, match.roundsTotal);
      match.playlistPrepStatus = "ready";
      match.playlistPrepReady = readySongs.length;
      match.playlistPrepError = null;
      emitLobbyState(emit, match);
      return;
    }
  }

  match.playlistPrepStatus = "error";
  match.playlistPrepError = "PLAYLIST_PREP_TIMEOUT";
  emitLobbyState(emit, match);
}

function emitLobbyState(emit: EmitMatchEvent, match: MatchState): void {
  emit(match.matchId, "match:state", toLobbyPayload(match));
}
