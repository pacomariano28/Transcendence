hemos añadido dotenv ya que no tenemos la inyección desde el docker compose de la variable de entorno JWT_SECRET

necesito crear un .env que lo tenga dentro de este servicio y acceder a ella a través de dotenv

Si la función recibe (req, res, next) y puede “cortar” la request → middlewares/

Si es una función pura sin Express (ej: validar objeto, formatear) → lib/ o utils/

AccesToken está firmado con JWT_SECRET y tiene payload
RefreshToken es un string random que conseguimos con crypto.randomBytes

vamos a ver si prettier y eslint nos sirve para controlar el formateo

> npm install -D prettier eslint
> npm install -D typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin

Zod es una librería de validación runtime (comprueba datos en ejecución) que además genera tipos TS (te ayuda en compile-time) a partir de los schemas.

Esto es importante porque TypeScript no valida en runtime. Si el cliente manda password: 123, TS no te salva.
Copilot said: Zod “renta” cuando quieres **validar inputs** (body/query/params)

Zod renta cuando quieres validar inputs (body/query/params) y que TypeScript te ayude a no romper cosas. En Express, si no usas algo así, normalmente acabas con:

req.body es any
validaciones repetidas a mano en cada endpoint
errores 400 inconsistentes
bugs “raros” porque faltaba un campo o venía con otro tipo

TODO LIST

[] Añadir endpoint logout
[x] Cambiar persistencia
[] Limpiar código

**Crear tablas + schemas**
docker exec -i songuess-postgres psql -U postgres_user -d postgres_db -v ON_ERROR_STOP=1 <<'SQL'
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- crea el schema que Prisma está usando
CREATE SCHEMA IF NOT EXISTS auth;

-- (opcional pero recomendado) asegura que el owner tenga permisos
ALTER SCHEMA auth OWNER TO postgres_user;

CREATE TABLE IF NOT EXISTS auth."User" (
"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
"email" text NOT NULL UNIQUE,
"username" text NOT NULL UNIQUE,
"passwordHash" text NOT NULL,
"createdAt" timestamptz NOT NULL DEFAULT now(),
"updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth."RefreshToken" (
"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
"tokenHash" text NOT NULL UNIQUE,
"userId" uuid NOT NULL REFERENCES auth."User"("id") ON DELETE CASCADE,
"expiresAt" timestamptz NOT NULL,
"revokedAt" timestamptz NULL,
"createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON auth."RefreshToken" ("userId");
SQL

**Comprobar que existen**
docker exec -it songuess-postgres psql -U postgres_user -d postgres_db -c '\dt auth.*'

**Ver tabla User**
docker exec -it songuess-postgres psql -U postgres_user -d postgres_db -c SELECT * FROM auth."User";

**logout auth-service**

1. src/lib/refreshTokens.ts — add a revokeRefreshToken(refreshToken: string) function

Hash the incoming raw token with hashToken
Find the DB record; throw INVALID_REFRESH_TOKEN if not found or already revoked
Set revokedAt = new Date() via prisma.refreshToken.update
This is a pure DB write, symmetric to how consumeRefreshToken works 2. src/schemas/auth.schemas.ts — add logoutBodySchema

z.object({ refreshToken: z.string().min(1) }) — identical shape to refreshBodySchema; a separate schema keeps intent explicit 3. src/controllers/auth.controller.ts — add logout handler

Parse body with logoutBodySchema (400 on failure)
Call revokeRefreshToken(refreshToken) (throws on invalid/already-revoked)
Return 204 No Content on success (consistent with REST conventions for destructive operations that return no body)
Return 401 on INVALID_REFRESH_TOKEN error
The handler should require authentication (requireAuth) so only the token owner can revoke it; optionally also verify that res.locals.user.id === revokedToken.userId to prevent cross-user revocation 4. src/routes/auth.ts — register the route

authRouter.post("/logout", requireAuth, authController.logout)
Placing requireAuth enforces that a valid access token is present, preventing anonymous token invalidation abuse 5. README.md — add POST /auth/logout to the endpoints table

6. NOTES.md — mark the logout TODO as done
