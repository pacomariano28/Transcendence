import { io } from "socket.io-client";

const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(SOCKET_BASE_URL, {
  path: "/socket.io",
  autoConnect: false,
  withCredentials: true,
});
