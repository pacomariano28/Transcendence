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
[] Cambiar persistencia
[] Limpiar código