import jwt, { type JwtPayload } from "jsonwebtoken";
/**
 * type JwtPayload es un tipo de TypeScript que describe el objeto típico que devuelve verify cuando el token contiene un payload JSON (claims).
 */


/**
 * Función IIFE
 * 
 * Un ternario pero chetao
 * Ejecutamos la función definida instantaneamente ( gracias al último () ) y guardamos el valor directamente en la variable.
 * 
 * La uso en este caso porque en este momento necesito esta función que nose si la necesitaré mas adelane. Si la necesitara pues ya la extraigo y hago una función normal. :MOD
 */
const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
})(); // el último parentesis puede rellenarse con los parámetros que le queramos mandar a la función en el momento. Ej: const result = ((name: string) => `Hola ${name}`)("Paco");

if (!JWT_SECRET) {
  // Fallar rápido en dev/CI si no está configurado
  throw new Error("JWT_SECRET is not set");
}



// definimos que información va dentro del token, puede que pongamos más :MOD
export type AccessTokenPayload = {
  sub: string; // user id

  // estas dos es posible que las quitemos y las recojamos directamente de la DB :MOD
  email: string;
  username: string;
};



// firmar un payload con nuestro token 
// payload es lo que va dentro del token. 
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "15m"
  });
}



// verificar un payload con nuestro token
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);

  // validamos que está intacto según nuestro token
  // jsonwebtoken devuelve string | JwtPayload según el caso
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  // casteamos el payload que hemos recibido que puede tener muchas mas cosas para solo guardar lo que hemos definido en nuestra estructura
  const p = decoded as JwtPayload;

  // validación mínima de campos esperados
  // solo validamos que tengan valor ahora mismo :MOD
  if (!p.sub || !p.email || !p.username) {
    throw new Error("Invalid token payload");
  }

  // si todo ha ido guay, devolvemos el AccesTokenPayload
  return {
    sub: String(p.sub),
    email: String(p.email),
    username: String(p.username)
  };
}