import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type {
  LobbyPlaylistOption,
  PlaylistPrepStatus,
  SelectedLobbyPlaylist,
} from "../types/socket.payloads";
import {
  SYSTEM_PLAYLIST_OWNER_ID,
  getGenrePlaylist,
  isSystemGenrePlaylist,
} from "../constants/genrePlaylists";
import {
  searchSpotifyCatalog,
  type CatalogSearchType,
} from "../api/spotifyPlaylists";
import { translateError } from "../i18n/translateError";

const PANEL_EXIT_MS = 220;
const SEARCH_DEBOUNCE_MS = 350;
const BACKDROP_Z = 55;
const PANEL_Z = 60;

type PanelState = "closed" | "open" | "closing";

type LobbyPlaylistPickerProps = {
  options: LobbyPlaylistOption[];
  selected: SelectedLobbyPlaylist | null;
  selectedImageUrl: string | null;
  prepStatus: PlaylistPrepStatus;
  prepReady: number;
  prepNeeded: number;
  prepError: string | null;
  isHost: boolean;
  onSelect: (option: LobbyPlaylistOption) => void;
};

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlaylistCover({
  imageUrl,
  sizeClass,
  preparing = false,
  accent,
  label,
}: {
  imageUrl: string | null;
  sizeClass: string;
  preparing?: boolean;
  accent?: string;
  label?: string;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 ${sizeClass}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            background: accent
              ? `linear-gradient(145deg, ${accent}33, #141416 70%)`
              : undefined,
          }}
        >
          <span
            className="text-sm font-semibold tracking-wide"
            style={{ color: accent ?? "#71717a" }}
          >
            {label?.slice(0, 3).toUpperCase() ?? "♪"}
          </span>
        </div>
      )}
      {preparing ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-[#f7d046]" />
        </div>
      ) : null}
    </div>
  );
}

function PlaylistOptionButton({
  option,
  selectedNow,
  preparingThis,
  isHost,
  isPreparing,
  subtitle,
  accent,
  onSelect,
}: {
  option: LobbyPlaylistOption;
  selectedNow: boolean;
  preparingThis: boolean;
  isHost: boolean;
  isPreparing: boolean;
  subtitle: string;
  accent?: string;
  onSelect: (option: LobbyPlaylistOption) => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      disabled={!isHost || isPreparing}
      onClick={() => onSelect(option)}
      className={[
        "group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-200",
        selectedNow
          ? "border-emerald-400/35 bg-emerald-400/10"
          : "border-transparent hover:border-white/10 hover:bg-white/5",
        isPreparing && !selectedNow ? "opacity-50" : "",
        "active:scale-[0.99]",
      ].join(" ")}
    >
      <PlaylistCover
        imageUrl={option.imageUrl}
        sizeClass="h-11 w-11"
        preparing={preparingThis}
        accent={accent}
        label={option.name}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-zinc-100">
          {option.name}
        </div>
        <div className="truncate text-xs text-zinc-500">{subtitle}</div>
        {preparingThis ? (
          <div className="mt-1 text-[11px] text-[#f7d046]/90">
            {t("lobby.playlistPreparingInline")}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function FilterPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg px-2.5 py-1 text-[11px] font-medium tracking-wide transition",
        active
          ? "bg-[#f7d046]/15 text-[#f7d046]"
          : "bg-white/5 text-zinc-400 hover:bg-white/8 hover:text-zinc-200",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function LobbyPlaylistPicker({
  options,
  selected,
  selectedImageUrl,
  prepStatus,
  prepReady,
  prepNeeded,
  prepError,
  isHost,
  onSelect,
}: LobbyPlaylistPickerProps) {
  const { t } = useTranslation();
  const [panelState, setPanelState] = useState<PanelState>("closed");
  const [query, setQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<CatalogSearchType>("all");
  const [albumResults, setAlbumResults] = useState<LobbyPlaylistOption[]>([]);
  const [playlistResults, setPlaylistResults] = useState<
    LobbyPlaylistOption[]
  >([]);
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const searchRef = useRef<HTMLInputElement>(null);
  const searchRequestId = useRef(0);

  const isOpen = panelState === "open";
  const isVisible = panelState !== "closed";
  const isPreparing = prepStatus === "loading";
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length >= 2;
  const showLocalPlaylists = searchFilter !== "album";
  const showAlbums = searchFilter === "all" || searchFilter === "album";
  const showRemotePlaylists =
    searchFilter === "all" || searchFilter === "playlist";

  const progressPct = useMemo(() => {
    if (prepNeeded <= 0) return 0;
    return Math.min(100, Math.round((prepReady / prepNeeded) * 100));
  }, [prepReady, prepNeeded]);

  const filteredOptions = useMemo(() => {
    if (!showLocalPlaylists) {
      return { genres: [] as LobbyPlaylistOption[], players: [] as LobbyPlaylistOption[] };
    }

    const q = trimmedQuery.toLowerCase();
    const list = !q
      ? options
      : options.filter((option) => {
          const haystack = [option.name, option.ownerDisplayName]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        });

    return {
      genres: list.filter((option) => isSystemGenrePlaylist(option.id)),
      players: list.filter((option) => !isSystemGenrePlaylist(option.id)),
    };
  }, [options, showLocalPlaylists, trimmedQuery]);

  const remoteAlbums = useMemo(() => {
    if (!hasQuery || !showAlbums) return [];
    return albumResults;
  }, [albumResults, hasQuery, showAlbums]);

  const remotePlaylists = useMemo(() => {
    if (!hasQuery || !showRemotePlaylists) return [];
    const knownIds = new Set(options.map((option) => option.id));
    return playlistResults.filter((option) => !knownIds.has(option.id));
  }, [hasQuery, options, playlistResults, showRemotePlaylists]);

  useEffect(() => {
    if (!isOpen || !hasQuery) {
      setAlbumResults([]);
      setPlaylistResults([]);
      setSearchStatus("idle");
      return;
    }

    const requestId = ++searchRequestId.current;
    setSearchStatus("loading");

    const timer = window.setTimeout(async () => {
      try {
        const results = await searchSpotifyCatalog(trimmedQuery, searchFilter);
        if (searchRequestId.current !== requestId) return;

        setAlbumResults(
          results.albums.map((album) => ({
            id: album.id,
            name: album.name,
            imageUrl: album.imageUrl,
            trackCount: album.trackCount,
            ownerUserId: SYSTEM_PLAYLIST_OWNER_ID,
            ownerDisplayName: album.ownerName ?? "Artist",
            kind: "album" as const,
          })),
        );
        setPlaylistResults(
          results.playlists.map((playlist) => ({
            id: playlist.id,
            name: playlist.name,
            imageUrl: playlist.imageUrl,
            trackCount: playlist.trackCount,
            ownerUserId: SYSTEM_PLAYLIST_OWNER_ID,
            ownerDisplayName: playlist.ownerName ?? "Spotify",
            kind: "playlist" as const,
          })),
        );
        setSearchStatus("idle");
      } catch {
        if (searchRequestId.current !== requestId) return;
        setAlbumResults([]);
        setPlaylistResults([]);
        setSearchStatus("error");
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [hasQuery, isOpen, searchFilter, trimmedQuery]);

  function openPanel() {
    if (!isHost) return;
    setPanelState("open");
  }

  function closePanel() {
    setPanelState((state) => (state === "open" ? "closing" : state));
  }

  useEffect(() => {
    if (panelState !== "closing") return;
    const timer = window.setTimeout(() => {
      setPanelState("closed");
      setQuery("");
      setSearchFilter("all");
      setAlbumResults([]);
      setPlaylistResults([]);
      setSearchStatus("idle");
    }, PANEL_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [panelState]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 40);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePanel();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const wasPreparingRef = useRef(false);
  useEffect(() => {
    if (prepStatus === "loading") {
      wasPreparingRef.current = true;
      return;
    }
    if (prepStatus === "ready" && wasPreparingRef.current && isOpen) {
      wasPreparingRef.current = false;
      closePanel();
    }
  }, [prepStatus, isOpen]);

  function handleSelect(option: LobbyPlaylistOption) {
    if (!isHost) return;
    onSelect(option);
  }

  const title = selected?.name ?? t("lobby.playlistNoneSelected");
  const subtitle = selected
    ? selected.kind === "album"
      ? t("lobby.playlistAlbumBy", {
          artists: selected.ownerDisplayName,
        })
      : isSystemGenrePlaylist(selected.id)
        ? t("lobby.playlistGenreSource", {
            playlist:
              getGenrePlaylist(selected.id)?.spotifyPlaylistName ?? "Spotify",
          })
        : t("lobby.playlistOwnedBy", { name: selected.ownerDisplayName })
    : isHost
      ? t("lobby.playlistSelectPrompt")
      : t("lobby.playlistGuestHint");

  const selectedGenre = getGenrePlaylist(selected?.id ?? "");
  const showEmpty =
    filteredOptions.genres.length === 0 &&
    filteredOptions.players.length === 0 &&
    remoteAlbums.length === 0 &&
    remotePlaylists.length === 0 &&
    searchStatus !== "loading";

  const panel = isVisible
    ? createPortal(
        <>
          <div
            role="presentation"
            data-playlist-picker-backdrop
            className={[
              "focus-backdrop fixed inset-0 bg-zinc-950/45 backdrop-blur-[2px]",
              panelState === "closing"
                ? "focus-backdrop-exit"
                : "focus-backdrop-enter",
            ].join(" ")}
            style={{ zIndex: BACKDROP_Z }}
            onClick={closePanel}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("lobby.playlistPickerTitle")}
            data-playlist-picker-panel
            className={[
              "playlist-picker-panel fixed left-1/2 top-1/2 flex w-[min(92vw,28rem)] max-h-[min(80vh,34rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#141416] shadow-[0_20px_60px_rgba(0,0,0,0.55)]",
              panelState === "closing"
                ? "playlist-picker-panel-exit"
                : "playlist-picker-panel-enter",
            ].join(" ")}
            style={{ zIndex: PANEL_Z }}
          >
            <div className="border-b border-white/10 px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                  {t("lobby.playlistPickerTitle")}
                </div>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
                  onClick={closePanel}
                >
                  {t("lobby.playlistClose")}
                </button>
              </div>

              <label className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 transition focus-within:border-[#f7d046]/35">
                <SearchIcon className="h-4 w-4 shrink-0 text-zinc-500" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("lobby.playlistSearchPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                />
              </label>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <FilterPill
                  active={searchFilter === "all"}
                  label={t("lobby.playlistFilterAll")}
                  onClick={() => setSearchFilter("all")}
                />
                <FilterPill
                  active={searchFilter === "album"}
                  label={t("lobby.playlistFilterAlbums")}
                  onClick={() => setSearchFilter("album")}
                />
                <FilterPill
                  active={searchFilter === "playlist"}
                  label={t("lobby.playlistFilterPlaylists")}
                  onClick={() => setSearchFilter("playlist")}
                />
              </div>

              {(isPreparing || prepStatus === "error") && (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
                  {isPreparing ? (
                    <>
                      <div className="flex items-center justify-between gap-2 text-xs text-zinc-300">
                        <span className="truncate">
                          {t("lobby.playlistPreparingShort", {
                            name: selected?.name ?? "…",
                          })}
                        </span>
                        <span className="shrink-0 font-mono text-zinc-400">
                          {prepReady}/{prepNeeded}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#f7d046] transition-all duration-500 ease-out"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-rose-200">
                      {translateError(
                        prepError ?? "PLAYLIST_PREP_FAILED",
                        t,
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
              {showEmpty ? (
                <div className="px-3 py-8 text-center text-sm text-zinc-500">
                  {t("lobby.playlistSearchEmpty")}
                </div>
              ) : (
                <div className="grid gap-4">
                  {hasQuery && showAlbums ? (
                    <section>
                      <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">
                        {t("lobby.playlistSectionAlbums")}
                      </div>
                      {searchStatus === "loading" &&
                      remoteAlbums.length === 0 ? (
                        <div className="px-2 py-3 text-xs text-zinc-500">
                          {t("lobby.playlistSearchLoading")}
                        </div>
                      ) : searchStatus === "error" &&
                        remoteAlbums.length === 0 &&
                        remotePlaylists.length === 0 ? (
                        <div className="px-2 py-3 text-xs text-rose-200">
                          {t("lobby.playlistSearchFailed")}
                        </div>
                      ) : remoteAlbums.length === 0 ? (
                        <div className="px-2 py-3 text-xs text-zinc-500">
                          {t("lobby.playlistSearchEmpty")}
                        </div>
                      ) : (
                        <div className="grid gap-1.5">
                          {remoteAlbums.map((option) => {
                            const selectedNow =
                              selected?.id === option.id &&
                              selected.kind === "album";
                            const trackSuffix =
                              option.trackCount > 0
                                ? ` · ${option.trackCount}`
                                : "";
                            return (
                              <PlaylistOptionButton
                                key={`album:${option.id}`}
                                option={option}
                                selectedNow={selectedNow}
                                preparingThis={isPreparing && selectedNow}
                                isHost={isHost}
                                isPreparing={isPreparing}
                                subtitle={`${t("lobby.playlistAlbumBy", {
                                  artists: option.ownerDisplayName,
                                })}${trackSuffix}`}
                                onSelect={handleSelect}
                              />
                            );
                          })}
                        </div>
                      )}
                    </section>
                  ) : null}

                  {filteredOptions.genres.length > 0 ? (
                    <section>
                      <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">
                        {t("lobby.playlistSectionGenres")}
                      </div>
                      <div className="grid gap-1.5">
                        {filteredOptions.genres.map((option) => {
                          const genre = getGenrePlaylist(option.id);
                          const selectedNow =
                            selected?.id === option.id &&
                            selected.kind !== "album";
                          return (
                            <PlaylistOptionButton
                              key={`genre:${option.id}`}
                              option={{ ...option, kind: "playlist" }}
                              selectedNow={selectedNow}
                              preparingThis={isPreparing && selectedNow}
                              isHost={isHost}
                              isPreparing={isPreparing}
                              subtitle={genre?.spotifyPlaylistName ?? "Spotify"}
                              accent={genre?.accent}
                              onSelect={handleSelect}
                            />
                          );
                        })}
                      </div>
                    </section>
                  ) : null}

                  {filteredOptions.players.length > 0 ? (
                    <section>
                      <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">
                        {t("lobby.playlistSectionPlayers")}
                      </div>
                      <div className="grid gap-1.5">
                        {filteredOptions.players.map((option) => {
                          const selectedNow =
                            selected?.id === option.id &&
                            selected.ownerUserId === option.ownerUserId &&
                            selected.kind !== "album";
                          const trackSuffix =
                            option.trackCount > 0
                              ? ` · ${option.trackCount}`
                              : "";
                          return (
                            <PlaylistOptionButton
                              key={`${option.ownerUserId}:${option.id}`}
                              option={{ ...option, kind: "playlist" }}
                              selectedNow={selectedNow}
                              preparingThis={isPreparing && selectedNow}
                              isHost={isHost}
                              isPreparing={isPreparing}
                              subtitle={`${t("lobby.playlistOwnedBy", {
                                name: option.ownerDisplayName,
                              })}${trackSuffix}`}
                              onSelect={handleSelect}
                            />
                          );
                        })}
                      </div>
                    </section>
                  ) : null}

                  {hasQuery && showRemotePlaylists ? (
                    <section>
                      <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">
                        {t("lobby.playlistSectionPlaylists")}
                      </div>
                      {searchStatus === "loading" &&
                      remotePlaylists.length === 0 ? (
                        <div className="px-2 py-3 text-xs text-zinc-500">
                          {t("lobby.playlistSearchLoading")}
                        </div>
                      ) : remotePlaylists.length === 0 ? (
                        <div className="px-2 py-3 text-xs text-zinc-500">
                          {t("lobby.playlistSearchEmpty")}
                        </div>
                      ) : (
                        <div className="grid gap-1.5">
                          {remotePlaylists.map((option) => {
                            const selectedNow =
                              selected?.id === option.id &&
                              selected.kind !== "album";
                            const trackSuffix =
                              option.trackCount > 0
                                ? ` · ${option.trackCount}`
                                : "";
                            return (
                              <PlaylistOptionButton
                                key={`search:${option.id}`}
                                option={option}
                                selectedNow={selectedNow}
                                preparingThis={isPreparing && selectedNow}
                                isHost={isHost}
                                isPreparing={isPreparing}
                                subtitle={`${t("lobby.playlistOwnedBy", {
                                  name: option.ownerDisplayName,
                                })}${trackSuffix}`}
                                onSelect={handleSelect}
                              />
                            );
                          })}
                        </div>
                      )}
                    </section>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <>
      {panel}

      <div className="mt-8 page-card">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
            {t("lobby.playlistTitle")}
          </div>
          <div className="text-xs text-zinc-400">
            {isHost ? t("lobby.playlistHostHint") : t("lobby.playlistGuestHint")}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={openPanel}
            disabled={!isHost}
            className={[
              "group relative shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7d046]/45",
              isHost
                ? "cursor-pointer transition duration-300 ease-out hover:scale-[1.03]"
                : "cursor-default",
            ].join(" ")}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-label={t("lobby.playlistChange")}
          >
            <PlaylistCover
              imageUrl={selectedImageUrl}
              sizeClass="h-20 w-20 sm:h-24 sm:w-24"
              preparing={isPreparing}
              accent={selectedGenre?.accent}
              label={selected?.name}
            />
            {isHost ? (
              <span className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-2xl bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="mb-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-100 backdrop-blur-sm">
                  {selected
                    ? t("lobby.playlistChange")
                    : t("lobby.playlistChoose")}
                </span>
              </span>
            ) : null}
          </button>

          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-medium text-zinc-100 sm:text-lg">
              {title}
            </div>
            <div className="mt-1 truncate text-xs text-zinc-500">{subtitle}</div>

            {isPreparing ? (
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                  <span>{t("lobby.playlistPreparingInline")}</span>
                  <span className="font-mono">
                    {prepReady}/{prepNeeded}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#f7d046] transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            ) : null}

            {prepStatus === "error" && !isVisible ? (
              <div className="mt-2 text-xs text-rose-200">
                {translateError(prepError ?? "PLAYLIST_PREP_FAILED", t)}
              </div>
            ) : null}

            {isHost && !selected && prepStatus === "idle" ? (
              <button
                type="button"
                onClick={openPanel}
                className="mt-3 text-xs font-medium text-[#f7d046] transition hover:text-[#ffe08a]"
              >
                {t("lobby.playlistChoose")} →
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
