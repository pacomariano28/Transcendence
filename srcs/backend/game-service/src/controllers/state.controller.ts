import { Request, Response } from "express";
import { matchService } from "../services/match.service.js";

export async function getUserState(req: Request, res: Response) {
  const rawUserId = req.headers["x-user-id"];
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

  if (!userId)
    return res.status(401).json({ ok: false, error: "USER_NOT_AUTH" });

  console.log(`userId is ${userId}`);

  try {
    const player = matchService.getPlayerByUserId(userId);

    if (player) {
      console.log(`Player '${player.displayName}': is connected to a match`);
      return res.status(423).json({ ok: false, error: "USER_ALREADY_IN_GAME" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "INVALID_USER";
    return res.status(500).json({ ok: false, message });
  }
}

export async function getMatchState(req: Request, res: Response) {
  try {
    const payload = req.body as { matchId: string };
    const match = matchService.getMatchOrThrow(payload?.matchId);
    return res.status(200).json({ ok: true, match });
  } catch (err) {
    const message = err instanceof Error ? err.message : "INVALID_USER";
    if (message === "MATCH_NOT_FOUND")
      return res.status(551).json({ ok: false, message });
    return res.status(500).json({ ok: false, message });
  }
}
