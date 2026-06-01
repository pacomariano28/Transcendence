import { Lobby, Player, RoundStatus } from "../models/lobby.model.js";
import { getPlaylist } from "./playlist.service.js";
import { randomUUID } from "crypto";

// Almacenamiento temporal en memoria
const lobbies = new Map<string, Lobby>();

export async function createLobby({
  hostUserId,
  maxPlayers,
  username,
}: {
  hostUserId: string;
  maxPlayers: number;
  username: string;
}): Promise<Lobby> {
  const playlist = await getPlaylist();

  const rounds: RoundStatus[] = playlist.map((_, idx) => ({
    active: idx === 0,
    winner: null,
    tries: null,
  }));

  const newLobby: Lobby = {
    lobbyId: randomUUID(),
    state: "waiting",
    hostUserId,
    createdAt: new Date().toISOString(),
    players: [{ userId: hostUserId, username, score: 0, ready: false }],
    playlist,
    currentRound: 0,
    rounds,
    maxPlayers,
  };

  lobbies.set(newLobby.lobbyId, newLobby);
  return newLobby;
}

export function joinLobby(
  lobbyId: string,
  userId: string,
  username: string,
): Lobby {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) throw new Error("Lobby not found");
  if (lobby.players.some((p) => p.userId === userId))
    throw new Error("Already in lobby");
  if (lobby.players.length >= lobby.maxPlayers) throw new Error("Lobby full");
  if (lobby.state !== "waiting") throw new Error("Lobby not open to join");

  lobby.players.push({ userId, username, score: 0, ready: false });
  return lobby;
}

export function setPlayerReady(
  lobbyId: string,
  userId: string,
  ready: boolean,
): Lobby {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) throw new Error("Lobby not found");
  const player = lobby.players.find((p) => p.userId === userId);
  if (!player) throw new Error("Player not in lobby");
  player.ready = ready;

  // Si TODOS están listos, puedes cambiar el estado a 'playing'
  if (lobby.players.every((p) => p.ready) && lobby.players.length > 1) {
    lobby.state = "playing";
  }
  return lobby;
}

// export function setPlayerReady(
//   lobbyId: string,
//   userId: string,
//   ready: boolean,
// ): Lobby {
//   const lobby = lobbies.get(lobbyId);
//   if (!lobby) throw new Error("Lobby not found");
//   const player = lobby.players.find((p) => p.userId === userId);
//   if (!player) throw new Error("Player not in lobby");
//   player.ready = ready;

//   // Paso a playing si todos están listos y hay al menos 2 jugadores
//   if (
//     lobby.players.length > 1 &&
//     lobby.players.every((p) => p.ready) &&
//     lobby.state === "waiting"
//   ) {
//     lobby.state = "playing";
//     lobby.currentRound = 0;

//     // Lanzar el evento de inicio de partida SOLO a los sockets de los jugadores en la lobby
//     const fileName = lobby.playlist[0]?.fileName;
//     io.to(lobby.lobbyId).emit("round:start", {
//       round: 0,
//       fileName,
//       players: lobby.players.map((p) => ({
//         userId: p.userId,
//         username: p.username,
//         score: p.score,
//       })),
//       totalRounds: lobby.playlist.length,
//     });
//   }
//   return lobby;
// }
