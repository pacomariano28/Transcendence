import { Request, Response } from "express";
import {
  createLobby,
  joinLobby,
  setPlayerReady,
  getLobbyById,
} from "../services/game.service.js";

export async function createLobbyController(req: Request, res: Response) {
  try {
    const { hostUserId, username, maxPlayers } = req.body;
    if (!hostUserId || !username || !maxPlayers)
      return res.status(400).json({ error: "Faltan datos obligatorios" });

    const lobby = await createLobby({ hostUserId, username, maxPlayers });
    res.status(201).json({
      lobbyId: lobby.lobbyId,
      state: lobby.state,
      hostUserId: lobby.hostUserId,
      createdAt: lobby.createdAt,
      players: lobby.players.map((p) => ({
        userId: p.userId,
        username: p.username,
        score: p.score,
        ready: p.ready,
      })),
      playlist: lobby.playlist.map((p) => ({
        fileName: p.fileName, // No envies trackId al frontend
      })),
      currentRound: lobby.currentRound,
      rounds: lobby.rounds,
      maxPlayers: lobby.maxPlayers,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error creando sala" });
  }
}

export function joinLobbyController(req: Request, res: Response) {
  try {
    const lobbyId = req.params.lobbyId;
    const { userId, username } = req.body;
    if (!userId || !username)
      return res.status(400).json({ error: "Missing user info" });

    const lobby = joinLobby(lobbyId, userId, username);
    res.json({
      lobbyId: lobby.lobbyId,
      state: lobby.state,
      players: lobby.players,
      maxPlayers: lobby.maxPlayers,
      currentRound: lobby.currentRound,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export function setPlayerReadyController(req: Request, res: Response) {
  try {
    const lobbyId = req.params.lobbyId;
    const { userId, ready } = req.body;
    if (typeof ready !== "boolean" || !userId)
      return res.status(400).json({ error: "Missing data" });

    const lobby = setPlayerReady(lobbyId, userId, ready);
    res.json({
      lobbyId: lobby.lobbyId,
      state: lobby.state,
      players: lobby.players,
      currentRound: lobby.currentRound,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export function getLobbyController(req: Request, res: Response) {
  const lobbyId = req.params.lobbyId;
  const lobby = getLobbyById(lobbyId);
  if (!lobby) return res.status(404).json({ error: "Lobby not found" });
  res.json(lobby);
}
