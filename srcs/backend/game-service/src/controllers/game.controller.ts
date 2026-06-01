// /srcs/backend/game-service/src/controllers/game.controller.ts

import { Request, Response } from "express";
import { createLobby } from "../services/game.service";

export async function createLobbyController(req: Request, res: Response) {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ error: "Falta el nombre de la sala." });
    const lobby = await createLobby(name);

    // No envías el trackId al frontend
    const safeLobby = {
      lobbyId: lobby.lobbyId,
      name: lobby.name,
      players: lobby.players,
      state: lobby.state,
      playlist: lobby.playlist.map((p) => ({ fileName: p.fileName })), // SOLO fileName!
      currentRound: lobby.currentRound,
    };

    res.status(201).json(safeLobby);
  } catch (err: any) {
    res.status(500).json({ error: "Error al crear sala." });
  }
}
