import { apiJson } from "./http";

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

export type SetupStatus = {
  ok: boolean;
  accessUrl: string;
  playableWithoutSpotify: boolean;
  autoApplied: string[];
  checks: {
    services: {
      ok: boolean;
      auth: boolean;
      content: boolean;
      game: boolean;
      playlist: boolean;
    };
    songLibrary: {
      ok: boolean;
      count: number;
      minimum: number;
    };
    spotifySearch: {
      ok: boolean;
      configured: boolean;
    };
    spotifyOAuth: {
      ok: boolean;
      redirectUri: string | null;
      redirectMatches: boolean;
    };
  };
  manualSteps: SetupManualStep[];
};

export async function fetchSetupStatus(): Promise<SetupStatus> {
  const origin = window.location.origin;
  const query = new URLSearchParams({ origin }).toString();
  return apiJson<SetupStatus>(`/api/setup/status?${query}`);
}
