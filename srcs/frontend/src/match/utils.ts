export function isMatchNotFoundError(message: string) {
  return message === "MATCH_NOT_FOUND" || message === "Match not found";
}

export function normalizeCode(raw: string) {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}
