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

/**
 * This function is used to ehck if the JWT exists. If it doesn't exist, it throws an error. If it does exist, it returns the JWT secret.
 */

/**
 * @brief Retrieve the JWT secret from environment variables.
 *
 * @description
 * This function checks if the JWT secret is defined in the environment variables. If the secret is not set, it throws an error to prevent the application from running without a crucial security component. If the secret is present, it returns the value for use in signing and verifying JWT tokens.
 * @returns The JWT secret as a string.
 * @throws Will throw an error if the JWT secret is not defined in the environment variables.
 *
 * @example
 * // Assuming process.env.JWT_SECRET is set to "mysupersecretkey"
 * const secret = getJwtSecret();
 * console.log("JWT Secret:", secret); // Output: JWT Secret
 */
const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;

  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
})(); // el último parentesis puede rellenarse con los parámetros que le queramos mandar a la función en el momento. Ej: const result = ((name: string) => `Hola ${name}`)("Paco");

// definimos que información va dentro del token, puede que pongamos más :MOD
export type AccessTokenPayload = {
  sub: string; // user id

  // estas dos es posible que las quitemos y las recojamos directamente de la DB :MOD
  email: string;
  username: string;
};

/**
 * @brief Issue a JWT access token for the given user ID.
 *
 * @description
 * This function generates a JWT access token containing the specified user ID and other relevant information. The token is signed using the HS256 algorithm and has a validity period of 15 minutes.
 *
 * @param payload - The payload to include in the access token, typically containing user information such as ID, email, and username.
 * @returns A signed JWT access token as a string.
 *
 * @example const token = signAccessToken({ sub: "12345", email: "user@example.com", username: "john_doe" });
 */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "15m",
  });
}

/**
 * @brief Verify a JWT access token and extract its payload.
 *
 * @description
 * This function takes a JWT access token as input, verifies its authenticity using the predefined secret, and extracts the payload if the token is valid. If the token is invalid or the payload does not conform to the expected structure, an error is thrown.
 * @param token - The JWT access token to be verified.
 * @returns The verified access token payload.
 * @throws Will throw an error if the token is invalid or if the payload does not contain the expected fields (sub, email, username).
 *
 * @example
 * try {
 *   const payload = verifyAccessToken(token);
 *   console.log("Token is valid. Payload:", payload);
 * } catch (error) {
 *   console.error("Invalid token:", error.message);
 * }
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);

  // validamos que está intacto según nuestro token y que no es un string (porque el payload debería ser un objeto con claims, no un string)
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
    username: String(p.username),
  };
}
