// necesitamos acceder a la variable de entorno que no tenemos inyectada por el docker-compose, dotenv nos ayuda a acceder a ellas a traves del .env de este servicio
import "dotenv/config";
import express from "express";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { logInfo } from "./lib/logger.js";

const app = express();

/*

registramos middleware que se ejecuta en cada request.
cuando recibimos una request, el middleware se ejecuta y parsea el body de la request para que luego se procese en los handlers de cada endpoint.

Sin express.json(): req.body suele ser undefined.
Con express.json(): req.body ya es objeto ({ email: "...", password: "..." }).
Solo aplica cuando el cliente manda JSON válido y header correcto. ( cuando pone Content-Type: application/json ).


Ejemplo mental:

Cliente envía body: {"user":"paco"}
Sin middleware: Express no lo interpreta.
Con middleware: puedes hacer req.body.user.

*/
app.use(express.json());

app.use(healthRouter);

app.use(authRouter);

const port = Number(process.env.PORT ?? 4002);

app.listen(port, "0.0.0.0", () => {
  logInfo(`[auth-service] listening on port ${port}`);
});
