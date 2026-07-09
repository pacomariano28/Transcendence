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

const DISTINCT_VERSION_PATTERN =
  /remix|live|acoustic|acústic|acústico|unplugged|radio edit|extended|instrumental|demo|cover|karaoke|reprise|en vivo|sped up/i;

function normalizeDedupKey(str: string): string {
  return str.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * @brief Formats a track name for display in search results.
 *
 * @details Distinct versions (remix, live, acoustic, etc.) keep the original
 * Spotify title so they remain distinguishable from the base track. All other
 * titles use @ref clearString().
 */
export function formatTrackName(str: string): string {
  if (DISTINCT_VERSION_PATTERN.test(str)) {
    return str.trim().replace(/\s\s+/g, " ");
  }

  return clearString(str);
}

/**
 * @brief Builds a deduplication key for a track based on its display identity.
 *
 * @details Different Spotify editions of the same recording (single, album,
 * compilation, reissue) often carry distinct ISRCs but collapse to the same
 * display title after @ref formatTrackName(). Those are deduplicated here.
 */
export function getTrackDedupKey(rawName: string, artist: string): string {
  return `${normalizeDedupKey(formatTrackName(rawName))}|${normalizeDedupKey(artist)}`;
}
