function stripBrackets(input: string, opening: string): string {
  let result: string = "";
  let depth: number = 0;
  let closing: string = "";

  if (opening === "[") closing = "]";
  else if (opening === "(") closing = ")";

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === opening) {
      depth++;
    } else if (char === closing) {
      if (depth > 0) depth--;
    } else if (depth === 0) {
      // Only append characters when not inside any brackets
      result += char;
    }
  }

  return result;
}

/**
 * @brief Clears a string by removing brackets and normalizing whitespace.
 *
 * @details This function processes a string through the following steps:
 * - Removes content within parentheses ()
 * - Removes content within square brackets []
 * - Removes everything after dashes (-, –, —)
 * - Replaces multiple consecutive whitespaces with a single space
 * - Trims leading and trailing whitespace
 *
 * @param str The input string to clear
 * @return A cleared string with brackets removed, normalized whitespace, and trimmed
 *
 * @example
 * clearString("The Title (Remix) - Extended") // Returns "The Title"
 * clearString("Song  [Feat. Artist]") // Returns "Song"
 *
 * and maintains spacing between words (normalized to single spaces).
 */
export function clearString(str: string): string {
  let result: string;

  result = stripBrackets(str, "(");
  result = stripBrackets(result, "[");

  return result
    .replace(/\s+[-–—]\s+.*/g, "")
    .trim()
    .replace(/\s\s+/g, " ");
}

function normalizeDedupKey(str: string): string {
  return str.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * @brief Normalizes a track title for search grouping.
 *
 * @details Collapses all version variants (remix, live, remaster, single version,
 * album version, etc.) to the base song title. Used only by the search experience.
 */
export function normalizeSearchTitle(str: string): string {
  return clearString(str);
}

/**
 * @brief Builds a search grouping key from a raw track title and artist.
 */
export function getSearchGroupKey(rawName: string, artist: string): string {
  return `${normalizeDedupKey(normalizeSearchTitle(rawName))}|${normalizeDedupKey(artist)}`;
}

/**
 * @brief Returns whether a raw Spotify title looks like a version variant.
 */
export function isVersionVariant(rawName: string): boolean {
  return (
    normalizeDedupKey(normalizeSearchTitle(rawName)) !==
    normalizeDedupKey(rawName)
  );
}

/**
 * @brief Formats a track name for metadata display (playlist/reveal).
 *
 * @details Version variants keep the original Spotify title so the real recording
 * version remains visible. Base titles use @ref clearString().
 */
export function formatTrackName(str: string): string {
  const trimmed = str.trim().replace(/\s+/g, " ");

  if (isVersionVariant(trimmed)) {
    return trimmed;
  }

  return clearString(trimmed);
}
