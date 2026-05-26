import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { logInfo } from "./lib/logger.js";
import { registerSocketHandlers } from "./routes/socketHandlers.js";

const port = process.env.PORT ?? 4001;

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

registerSocketHandlers(io);

server.listen(port, () => {
  logInfo(`Game service listening on port ${port}`);
});
