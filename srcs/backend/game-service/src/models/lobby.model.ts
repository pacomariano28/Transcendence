// /srcs/backend/game-service/src/models/lobby.model.ts

export interface PlaylistItem {
  trackId: string;
  fileName: string;
}

export interface Lobby {
  lobbyId: string;
  name: string;
  players: any[]; // Puedes tipar mejor luego
  state: "waiting" | "in_progress" | "finished";
  createdAt: Date;
  playlist: PlaylistItem[];
  currentRound: number;
}
