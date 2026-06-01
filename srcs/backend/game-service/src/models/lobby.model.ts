export interface Player {
  userId: string;
  username: string;
  score: number;
  ready: boolean;
}

export interface PlaylistItem {
  trackId: string;
  fileName: string;
}

export interface RoundStatus {
  active: boolean;
  winner: string | null;
  tries: number | null;
}

export interface Lobby {
  lobbyId: string;
  state: "waiting" | "playing" | "finished";
  hostUserId: string;
  createdAt: string;
  players: Player[];
  playlist: PlaylistItem[];
  currentRound: number;
  rounds: RoundStatus[];
  maxPlayers: number; // <-- nuevo campo
}
