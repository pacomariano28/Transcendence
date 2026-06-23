import type { MatchStatePayload } from "../types/socket.payloads";
import { apiJson, apiJsonPost } from "./http";

interface MatchResponse {
  ok: boolean;
  match: MatchStatePayload;
}

export async function getState(): Promise<Response> {
  return await apiJson("/api/game/state");
}

export async function getMatchState(payload: {
  matchId: string;
}): Promise<MatchStatePayload> {
  const res = await apiJsonPost<MatchResponse>(
    "/api/game/match-state",
    payload,
  );

  return res.match;
}
