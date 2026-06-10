import { apiJson } from "./http";

export async function getState(): Promise<Response> {
  return await apiJson("/api/game/state");
}
