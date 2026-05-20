import { io } from "socket.io-client";

const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(SOCKET_BASE_URL, {
  path: "/api/game/socket.io",
  autoConnect: false,
  withCredentials: true,
});
