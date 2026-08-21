import type { Request, Response } from "express";

const TIMEOUT_MS = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 1500);

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://auth-service:4002";
const CONTENT_SERVICE_URL =
  process.env.CONTENT_SERVICE_URL || "http://content-service:4003";
const GAME_SERVICE_URL =
  process.env.GAME_SERVICE_URL || "http://game-service:4001";
const PLAYLIST_SERVICE_URL =
  process.env.PLAYLIST_SERVICE_URL || "http://playlist-service:4004";

const MIN_SONGS_FOR_MATCH = 5;

export type SetupManualStepId =
  | "spotify_content_credentials"
  | "spotify_oauth_credentials"
  | "spotify_redirect_uri"
  | "media_library"
  | "trust_certificate"
  | "run_make_up";

export type SetupManualStep = {
  id: SetupManualStepId;
  severity: "error" | "warning" | "info";
};

type ProbeResult = { ok: boolean; error?: string };

async function probeJson<T>(url: string): Promise<{ ok: boolean; data?: T }> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return { ok: false };
    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}

async function probeHealth(name: string, baseUrl: string): Promise<ProbeResult> {
  const result = await probeJson<{ status?: string }>(`${baseUrl}/health`);
  return { ok: result.ok && result.data?.status === "ok", error: name };
}

function resolveAccessUrl(req: Request, origin: string): string {
  if (origin) return origin;
  const host = req.get("host");
  if (host) return `https://${host}`;
  return "https://127.0.0.1:8443";
}

export async function getAggregatedSetupStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const origin =
    typeof req.query.origin === "string" ? req.query.origin.trim() : "";
  const accessUrl = resolveAccessUrl(req, origin);

  const [authHealth, contentHealth, gameHealth, playlistHealth] =
    await Promise.all([
      probeHealth("auth-service", AUTH_SERVICE_URL),
      probeHealth("content-service", CONTENT_SERVICE_URL),
      probeHealth("game-service", GAME_SERVICE_URL),
      probeHealth("playlist-service", PLAYLIST_SERVICE_URL),
    ]);

  const authSetup = await probeJson<{
    oauthConfigured?: boolean;
    redirectUri?: string | null;
    redirectMatches?: boolean;
  }>(
    `${AUTH_SERVICE_URL}/setup/status?${new URLSearchParams({ origin: accessUrl }).toString()}`,
  );

  const contentSetup = await probeJson<{
    credentialsConfigured?: boolean;
    searchOk?: boolean;
  }>(`${CONTENT_SERVICE_URL}/setup/status`);

  const songCountProbe = await probeJson<{ ok?: boolean; count?: number }>(
    `${PLAYLIST_SERVICE_URL}/available-count`,
  );

  const songCount = songCountProbe.data?.count ?? 0;
  const songLibraryOk =
    songCountProbe.ok &&
    songCountProbe.data?.ok === true &&
    songCount >= MIN_SONGS_FOR_MATCH;

  const manualSteps: SetupManualStep[] = [];
  const autoApplied: string[] = ["env_local_ip", "tls_certificates"];

  if (!contentSetup.data?.credentialsConfigured || !contentSetup.data?.searchOk) {
    manualSteps.push({
      id: "spotify_content_credentials",
      severity: "warning",
    });
  }

  if (!authSetup.data?.oauthConfigured) {
    manualSteps.push({
      id: "spotify_oauth_credentials",
      severity: "warning",
    });
  } else if (authSetup.data.redirectMatches === false) {
    manualSteps.push({
      id: "spotify_redirect_uri",
      severity: "warning",
    });
  }

  if (!songLibraryOk) {
    manualSteps.push({
      id: "media_library",
      severity: "error",
    });
  }

  manualSteps.push({
    id: "trust_certificate",
    severity: "info",
  });

  const servicesOk =
    authHealth.ok &&
    contentHealth.ok &&
    gameHealth.ok &&
    playlistHealth.ok;

  const blockingErrors = manualSteps.filter((step) => step.severity === "error");
  const playableWithoutSpotify = songLibraryOk && servicesOk;

  res.status(200).json({
    ok: servicesOk && blockingErrors.length === 0,
    accessUrl,
    playableWithoutSpotify,
    autoApplied,
    checks: {
      services: {
        ok: servicesOk,
        auth: authHealth.ok,
        content: contentHealth.ok,
        game: gameHealth.ok,
        playlist: playlistHealth.ok,
      },
      songLibrary: {
        ok: songLibraryOk,
        count: songCount,
        minimum: MIN_SONGS_FOR_MATCH,
      },
      spotifySearch: {
        ok: Boolean(contentSetup.data?.searchOk),
        configured: Boolean(contentSetup.data?.credentialsConfigured),
      },
      spotifyOAuth: {
        ok: Boolean(authSetup.data?.oauthConfigured),
        redirectUri: authSetup.data?.redirectUri ?? null,
        redirectMatches: authSetup.data?.redirectMatches ?? false,
      },
    },
    manualSteps,
  });
}
