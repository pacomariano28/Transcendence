export function isMatchNotFoundError(message: string) {
  return message === "MATCH_NOT_FOUND";
}

/** Normalizes URL match codes to uppercase alphanumeric, max 6 chars. */
export function normalizeCode(raw: string) {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}
