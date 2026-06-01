// /srcs/backend/game-service/src/services/game.service.ts

import { Lobby } from "../models/lobby.model";
import { getPlaylist } from "./playlist.service";
import { randomUUID } from "crypto";

const lobbies = new Map<string, Lobby>(); // Simple almacenamiento temporal en memoria

export async function createLobby(name: string): Promise<Lobby> {
  const playlist = await getPlaylist();
  const lobby: Lobby = {
    lobbyId: randomUUID(),
    name,
    players: [],
    state: "waiting",
    createdAt: new Date(),
    playlist,
    currentRound: 0,
  };
  lobbies.set(lobby.lobbyId, lobby);
  return lobby;
}
