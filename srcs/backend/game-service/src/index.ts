import express from "express";
// import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { logInfo } from "./lib/logger.js";
import { registerSocketRoutes } from "./routes/socket.routes.js";
import { stateRouter } from "./routes/state.routes.js";

const port = process.env.PORT ?? 4001;

const app = express();
const server = createServer(app);

app.use(express.json());

app.use(stateRouter);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

registerSocketRoutes(io);

server.listen(port, () => {
  logInfo(`Game service listening on port ${port}`);
});
