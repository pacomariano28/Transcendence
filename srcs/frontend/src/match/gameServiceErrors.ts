/**
 * @brief Maps transport/proxy failures to a stable game-service outage code.
 *
 * @description
 * Socket.IO and HTTP proxies surface opaque messages when game-service is down
 * ("websocket error", "Service Unavailable", HTTP_502, …). Normalize those to
 * GAME_SERVICE_UNAVAILABLE so the UI can show a translated message.
 */
export function toGameServiceErrorCode(err: unknown): string {
  if (err instanceof Error && err.message === "GAME_SERVICE_UNAVAILABLE") {
    return "GAME_SERVICE_UNAVAILABLE";
  }

  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : err &&
            typeof err === "object" &&
            "message" in err &&
            typeof (err as { message: unknown }).message === "string"
          ? (err as { message: string }).message
          : String(err ?? "");

  const message = raw.trim();
  if (!message) return "GAME_SERVICE_UNAVAILABLE";

  if (
    message === "GAME_SERVICE_UNAVAILABLE" ||
    message === "GAME_CONNECTION_LOST" ||
    message === "Service Unavailable" ||
    message === "Internal server error" ||
    /^HTTP_50[234]$/.test(message) ||
    /websocket error/i.test(message) ||
    /xhr poll error/i.test(message) ||
    /transport error/i.test(message) ||
    /ECONNREFUSED/i.test(message) ||
    /ENOTFOUND/i.test(message) ||
    /socket hang up/i.test(message) ||
    /temporarily unavailable/i.test(message) ||
    /error occurred while trying to proxy/i.test(message)
  ) {
    return "GAME_SERVICE_UNAVAILABLE";
  }

  return message;
}
