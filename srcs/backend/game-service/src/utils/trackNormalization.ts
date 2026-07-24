function stripBrackets(input: string, opening: string): string {
  let result = "";
  let depth = 0;
  let closing = "";

  if (opening === "[") closing = "]";
  else if (opening === "(") closing = ")";

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === opening) {
      depth++;
    } else if (char === closing) {
      if (depth > 0) depth--;
    } else if (depth === 0) {
      result += char;
    }
  }

  return result;
}

function clearString(str: string): string {
  let result = stripBrackets(str, "(");
  result = stripBrackets(result, "[");

  return result
    .replace(/\s+[-–—]\s+.*/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeDedupKey(str: string): string {
  return str.trim().replace(/\s+/g, " ").toLowerCase();
}

function getSearchGroupKey(track: string, artist: string): string {
  return `${normalizeDedupKey(clearString(track))}|${normalizeDedupKey(artist)}`;
}

export function tracksMatchForGuess(
  guessTrack: string,
  guessArtist: string,
  previewTrack: string,
  previewArtist: string,
): boolean {
  return (
    getSearchGroupKey(guessTrack, guessArtist) ===
    getSearchGroupKey(previewTrack, previewArtist)
  );
}
