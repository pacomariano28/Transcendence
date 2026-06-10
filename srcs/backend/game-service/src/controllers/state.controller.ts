import { Request, Response } from "express";
import { matchService } from "../services/match.service.js";

export async function getUserState(req: Request, res: Response) {
  const rawUserId = req.headers["x-user-id"];
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

  if (!userId)
    return res.status(401).json({ ok: false, error: "User not authenticated" });

  console.log(`userId is ${userId}`);

  try {
    const match = matchService.getMatchByUserId(userId);

    if (match) {
      console.log(`match found is:\n ${JSON.stringify(match)}`);
      return res
        .status(423)
        .json({ ok: false, error: "User is already playing", match });
    }

    console.log("Match not found");

    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid user";
    return res.status(500).json({ ok: false, message });
  }
}
