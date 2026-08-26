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
  fetchPublicPlaylistTracks,
} from "../../clients/content.client.js";
import {
  ensureSongs,
  fetchSeedSongs,
  fetchSongsStatus,
  orderPlaylistTracks,
} from "../../clients/playlist.client.js";
import {
  CLIP_PREP_POLL_MS,
  CLIP_PREP_POLL_SLOW_AFTER_MS,
  CLIP_PREP_POLL_SLOW_MS,
  CLIP_PREP_RETRY_WAIT_MS,
  CLIP_PREP_TIMEOUT_MS,
  LOCAL_SEED_PLAYLIST,
  MIN_PLAYABLE_SONGS,
  PREP_CANDIDATE_POOL,
  PREP_ENSURE_BATCH,
  SYSTEM_PLAYLIST_OWNER_ID,
  TARGET_PREP_SONGS,
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

type TrackCandidate = {
  isrc: string;
  title?: string;
  artist?: string;
  spotifyTrackId?: string;
  durationMs?: number | null;
};

type PlayablePreparedSong = {
  isrc: string;
  fileName: string;
  title?: string;
  artist?: string;
};

function computeInitialPrepBatchSize(totalTracks: number): number {
  return Math.min(PREP_ENSURE_BATCH, totalTracks);
}

function buildPrepCandidatePool(tracks: TrackCandidate[]): TrackCandidate[] {
  if (tracks.length <= PREP_CANDIDATE_POOL) {
    return fisherYatesShuffle(tracks);
  }
  return fisherYatesShuffle(tracks).slice(0, PREP_CANDIDATE_POOL);
}

function currentClipPollDelayMs(elapsedMs: number): number {
  return elapsedMs >= CLIP_PREP_POLL_SLOW_AFTER_MS
    ? CLIP_PREP_POLL_SLOW_MS
    : CLIP_PREP_POLL_MS;
}

function isSongMediaPlayable(song: {
  status: string;
  fileName: string | null;
  mediaPlayable?: boolean;
}): boolean {
  return (
    song.status === "ready" &&
    Boolean(song.fileName) &&
    song.mediaPlayable !== false
  );
}

function pickPreparedSongs(
  readySongs: PlayablePreparedSong[],
  roundsTotal: number,
): PlayablePreparedSong[] {
  const shuffled = fisherYatesShuffle(readySongs);
  const take = Math.min(shuffled.length, Math.max(roundsTotal, MIN_PLAYABLE_SONGS));
  return shuffled.slice(0, take);
}

function collectPlayableSongs(
  candidates: TrackCandidate[],
  statusByIsrc: Map<
    string,
    {
      status: string;
      fileName: string | null;
      mediaPlayable?: boolean;
    }
  >,
): PlayablePreparedSong[] {
  const playable: PlayablePreparedSong[] = [];

  for (const candidate of candidates) {
    const status = statusByIsrc.get(candidate.isrc);
    if (!status || !isSongMediaPlayable(status) || !status.fileName) continue;

    playable.push({
      isrc: candidate.isrc,
      fileName: status.fileName,
      ...(candidate.title ? { title: candidate.title } : {}),
      ...(candidate.artist ? { artist: candidate.artist } : {}),
    });
  }

  return playable;
}

async function pollPreparedCandidates(
  candidates: TrackCandidate[],
  prepToken: number,
  matchId: string,
  emit: EmitMatchEvent,
  match: MatchState,
  maxWaitMs = CLIP_PREP_TIMEOUT_MS,
): Promise<PlayablePreparedSong[] | null> {
  const isrcs = candidates.map((candidate) => candidate.isrc);
  const startedAt = Date.now();

  while (Date.now() - startedAt < maxWaitMs) {
    if (prepTokens.get(matchId) !== prepToken) return null;

    const status = await fetchSongsStatus(isrcs);
    if (!status.ok) {
      match.playlistPrepStatus = "error";
      match.playlistPrepError = status.error;
      emitLobbyState(emit, match);
      return null;
    }

    const statusByIsrc = new Map(status.results.map((result) => [result.isrc, result]));
    const playable = collectPlayableSongs(candidates, statusByIsrc);
    const stillPending = status.results.some((result) => result.status === "pending");

    match.playlistPrepReady = playable.length;
    match.playlistPrepNeeded = MIN_PLAYABLE_SONGS;
    emitLobbyState(emit, match);

    if (playable.length >= MIN_PLAYABLE_SONGS) {
      return playable;
    }

    if (!stillPending) {
      return playable;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, currentClipPollDelayMs(Date.now() - startedAt)),
    );
  }

  const finalStatus = await fetchSongsStatus(isrcs);
  if (!finalStatus.ok) return [];

  const statusByIsrc = new Map(
    finalStatus.results.map((result) => [result.isrc, result]),
  );
  return collectPlayableSongs(candidates, statusByIsrc);
}

/**
 * Downloads and validates playable songs from the selected playlist only.
 * Never falls back to songs from a different playlist/source.
 */
async function prepareSelectedPlaylistSongs(
  match: MatchState,
  playlistKey: string,
  tracks: TrackCandidate[],
  prepToken: number,
  matchId: string,
  emit: EmitMatchEvent,
): Promise<boolean> {
  if (tracks.length < MIN_PLAYABLE_SONGS) {
    match.playlistPrepStatus = "error";
    match.playlistPrepError = "PLAYLIST_NOT_ENOUGH_PLAYABLE_SONGS";
    emitLobbyState(emit, match);
    return false;
  }

  const prepPool = buildPrepCandidatePool(tracks);

  const orderedResult = await orderPlaylistTracks(playlistKey, prepPool);
  if (!orderedResult.ok) {
    match.playlistPrepStatus = "error";
    match.playlistPrepError = orderedResult.error;
    emitLobbyState(emit, match);
    return false;
  }

  const ordered = orderedResult.tracks;
  const ensureBatchSize = computeInitialPrepBatchSize(ordered.length);
  const ensureBatch = ordered.slice(0, ensureBatchSize);

  match.playlistPrepNeeded = MIN_PLAYABLE_SONGS;
  match.playlistPrepReady = 0;
  emitLobbyState(emit, match);

  const ensureResult = await ensureSongs(ensureBatch);
  if (!ensureResult.ok) {
    match.playlistPrepStatus = "error";
    match.playlistPrepError = ensureResult.error;
    emitLobbyState(emit, match);
    return false;
  }

  let playable = await pollPreparedCandidates(
    ensureBatch,
    prepToken,
    matchId,
    emit,
    match,
  );
  if (playable === null) return false;

  let cursor = ensureBatchSize;

  while (
    playable.length < MIN_PLAYABLE_SONGS &&
    cursor < ordered.length &&
    prepTokens.get(matchId) === prepToken
  ) {
    const batch = ordered.slice(cursor, cursor + 3);
    cursor += batch.length;

    const retryEnsure = await ensureSongs(batch);
    if (!retryEnsure.ok) {
      match.playlistPrepStatus = "error";
      match.playlistPrepError = retryEnsure.error;
      emitLobbyState(emit, match);
      return false;
    }

    const batchPlayable = await pollPreparedCandidates(
      batch,
      prepToken,
      matchId,
      emit,
      match,
    );
    if (batchPlayable === null) return false;

    const seen = new Set(playable.map((song) => song.isrc));
    for (const song of batchPlayable) {
      if (!seen.has(song.isrc)) {
        playable.push(song);
        seen.add(song.isrc);
      }
    }

    match.playlistPrepReady = playable.length;
    emitLobbyState(emit, match);

    if (playable.length >= MIN_PLAYABLE_SONGS) {
      break;
    }
  }

  if (
    playable.length < MIN_PLAYABLE_SONGS &&
    prepTokens.get(matchId) === prepToken
  ) {
    const retryStatus = await fetchSongsStatus(
      ordered.map((track) => track.isrc),
    );
    if (retryStatus.ok) {
      const failedIsrcs = new Set(
        retryStatus.results
          .filter((result) => result.status === "failed")
          .map((result) => result.isrc),
      );
      const retryTracks = ordered.filter(
        (track) => failedIsrcs.has(track.isrc) && Boolean(track.title),
      );

      if (retryTracks.length > 0) {
        const retryEnsure = await ensureSongs(retryTracks);
        if (!retryEnsure.ok) {
          match.playlistPrepStatus = "error";
          match.playlistPrepError = retryEnsure.error;
          emitLobbyState(emit, match);
          return false;
        }

        const retried = await pollPreparedCandidates(
          retryTracks,
          prepToken,
          matchId,
          emit,
          match,
          CLIP_PREP_RETRY_WAIT_MS,
        );
        if (retried === null) return false;

        const seen = new Set(playable.map((song) => song.isrc));
        for (const song of retried) {
          if (!seen.has(song.isrc)) {
            playable.push(song);
            seen.add(song.isrc);
          }
        }

        match.playlistPrepReady = playable.length;
        emitLobbyState(emit, match);
      }
    }
  }

  if (prepTokens.get(matchId) !== prepToken) return false;

  if (playable.length < MIN_PLAYABLE_SONGS) {
    match.playlistPrepStatus = "error";
    match.playlistPrepError =
      cursor >= ordered.length
        ? "PLAYLIST_NOT_ENOUGH_PLAYABLE_SONGS"
        : "PLAYLIST_PREP_TIMEOUT";
    emitLobbyState(emit, match);
    return false;
  }

  match.preparedSongs = pickPreparedSongs(playable, match.roundsTotal);
  match.playlistPrepReady = match.preparedSongs.length;
  match.playlistPrepNeeded = MIN_PLAYABLE_SONGS;
  match.playlistPrepStatus = "ready";
  match.playlistPrepError = null;
  emitLobbyState(emit, match);
  return true;
}

async function applyLocalSeedLibrary(
  match: MatchState,
  emit: EmitMatchEvent,
  prepToken: number,
  matchId: string,
): Promise<boolean> {
  const seedResult = await fetchSeedSongs(TARGET_PREP_SONGS);
  if (!seedResult.ok || seedResult.songs.length === 0) {
    return false;
  }

  const candidates: TrackCandidate[] = seedResult.songs.map((song) => ({
    isrc: song.isrc,
    title: song.title ?? undefined,
    artist: song.artist ?? undefined,
  }));

  return prepareSelectedPlaylistSongs(
    match,
    LOCAL_SEED_PLAYLIST.id,
    candidates,
    prepToken,
    matchId,
    emit,
  );
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
  match.playlistPrepNeeded = MIN_PLAYABLE_SONGS;
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
  match.playlistPrepNeeded = MIN_PLAYABLE_SONGS;
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
  match.playlistPrepNeeded = MIN_PLAYABLE_SONGS;
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

    const applied = await applyLocalSeedLibrary(match, emit, prepToken, matchId);
    if (!applied && prepTokens.get(matchId) === prepToken) {
      if (match.playlistPrepStatus !== "error") {
        match.playlistPrepStatus = "error";
        match.playlistPrepError = "NOT_ENOUGH_SONGS_AVAILABLE";
        emitLobbyState(emit, match);
      }
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
    durationMs?: number | null;
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

    const tracksResult = await fetchPublicPlaylistTracks(selected.id, 50);
    if (tracksResult.ok && tracksResult.tracks.length > 0) {
      tracks = tracksResult.tracks;
      lastError = "";
    } else if (tracksResult.ok === false) {
      lastError = tracksResult.error;
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
      "prep",
    );
    if (tracksResult.ok && tracksResult.tracks.length > 0) {
      tracks = tracksResult.tracks;
      lastError = "";
      break;
    }
    if (tracksResult.ok === false) {
      lastError = tracksResult.error;
    }
  }

  if (!tracks.length) {
    if (prepTokens.get(matchId) !== prepToken) return;

    console.warn(
      `[playlist-prep] Playlist ${selected.id} track fetch failed: ${lastError}`,
    );

    match.playlistPrepStatus = "error";
    match.playlistPrepError = mapPlaylistTrackFetchError(lastError);
    emitLobbyState(emit, match);
    return;
  }

  const withIsrc: TrackCandidate[] = tracks
    .filter((track): track is typeof track & { isrc: string } => Boolean(track.isrc))
    .map((track) => ({
      isrc: track.isrc,
      title: track.name,
      artist: track.artists,
      spotifyTrackId: track.spotifyTrackId,
      durationMs: track.durationMs ?? null,
    }));

  if (withIsrc.length === 0) {
    if (prepTokens.get(matchId) !== prepToken) return;
    match.playlistPrepStatus = "error";
    match.playlistPrepError = "PLAYLIST_NO_ISRC_TRACKS";
    emitLobbyState(emit, match);
    return;
  }

  await prepareSelectedPlaylistSongs(
    match,
    selected.id,
    withIsrc,
    prepToken,
    matchId,
    emit,
  );
}

function mapPlaylistTrackFetchError(lastError: string): string {
  switch (lastError) {
    case "SPOTIFY_NOT_LINKED":
    case "SPOTIFY_NOT_CONFIGURED":
    case "SPOTIFY_REAUTH_REQUIRED":
    case "SPOTIFY_TOKENS_NOT_STORED":
    case "ERROR_FETCHING_DATA_FROM_SPOTIFY":
      return "SPOTIFY_NOT_LINKED";
    case "SPOTIFY_PLAYLIST_FORBIDDEN":
      return "SPOTIFY_PLAYLIST_FORBIDDEN";
    case "SPOTIFY_PLAYLIST_ITEMS_UNAVAILABLE":
      return "SPOTIFY_PLAYLIST_ITEMS_UNAVAILABLE";
    case "SPOTIFY_PLAYLIST_FETCH_TIMEOUT":
      return "SPOTIFY_PLAYLIST_FETCH_TIMEOUT";
    default:
      return lastError || "SPOTIFY_PLAYLIST_TRACKS_FAILED";
  }
}

function emitLobbyState(emit: EmitMatchEvent, match: MatchState): void {
  emit(match.matchId, "match:state", toLobbyPayload(match));
}
