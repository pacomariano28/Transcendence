hemos añadido dotenv ya que no tenemos la inyección desde el docker compose de la variable de entorno JWT_SECRET

necesito crear un .env que lo tenga dentro de este servicio y acceder a ella a través de dotenv

Si la función recibe (req, res, next) y puede “cortar” la request → middlewares/

Si es una función pura sin Express (ej: validar objeto, formatear) → lib/ o utils/

AccesToken está firmado con JWT_SECRET y tiene payload
RefreshToken es un string random que conseguimos con crypto.randomBytes