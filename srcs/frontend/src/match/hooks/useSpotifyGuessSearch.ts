/**
 * Debounced Spotify search and guess submission for the lock owner.
 * Search only runs while `canGuess` is true and no track is selected yet.
 */
import { useCallback, useEffect, useState } from "react";
import type { SpotifySearchTrack } from "../../api/spotify";
import { searchSpotifyTracks } from "../../api/spotify";
import { socket } from "../../api/socket";

type UseSpotifyGuessSearchOptions = {
  canGuess: boolean;
  matchCode: string;
};

export function useSpotifyGuessSearch({
  canGuess,
  matchCode,
}: UseSpotifyGuessSearchOptions) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifySearchTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<SpotifySearchTrack | null>(
    null,
  );

  const resetSearch = useCallback(() => {
    setSearchTerm("");
    setSearchResults([]);
    setSearching(false);
    setSearchError(null);
    setSelectedTrack(null);
  }, []);

  const clearGuessSelector = useCallback(() => {
    setSelectedTrack(null);
    setSearchTerm("");
    setSearchResults([]);
    setSearchError(null);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (!canGuess || selectedTrack) return;

    const term = searchTerm.trim();
    if (term.length < 2) return;

    setSearching(true);

    const abort = new AbortController();
    let cancelled = false;

    const timerId = window.setTimeout(() => {
      searchSpotifyTracks(term, abort.signal)
        .then((tracks) => {
          if (cancelled) return;
          setSearchResults(tracks);
          setSearchError(null);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          if (err instanceof DOMException && err.name === "AbortError") return;
          const message = err instanceof Error ? err.message : "SEARCH_FAILED";
          setSearchError(message);
          setSearchResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      abort.abort();
      window.clearTimeout(timerId);
    };
  }, [canGuess, searchTerm, selectedTrack]);

  const selectTrack = useCallback((track: SpotifySearchTrack) => {
    setSelectedTrack(track);
    setSearchTerm(`${track.track} - ${track.artist}`);
    setSearchResults([]);
    setSearchError(null);
    setSearching(false);
  }, []);

  const handleSearchTermChange = useCallback(
    (nextValue: string) => {
      setSearchTerm(nextValue);
      if (selectedTrack) {
        setSelectedTrack(null);
      }
      if (nextValue.trim().length < 2) {
        setSearchResults([]);
        setSearchError(null);
        setSearching(false);
      }
    },
    [selectedTrack],
  );

  const submitGuess = useCallback(
    (trackOverride?: SpotifySearchTrack) => {
      const track = trackOverride ?? selectedTrack;
      if (!canGuess || !track) return;
      socket.emit("round:guess_submit", {
        matchId: matchCode,
        isrc: track.isrc,
        track: track.track,
        artist: track.artist,
      });
      clearGuessSelector();
    },
    [canGuess, matchCode, selectedTrack, clearGuessSelector],
  );

  return {
    searchTerm,
    searchResults,
    searching,
    searchError,
    selectedTrack,
    resetSearch,
    selectTrack,
    handleSearchTermChange,
    submitGuess,
  };
}
