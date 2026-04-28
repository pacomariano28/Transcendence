import jwt, { type JwtPayload } from "jsonwebtoken";

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
})();

/**
 * @brief Interface representing the payload of a JWT access token.
 *
 * @description
 * This interface defines the structure of the payload that will be included in the JWT access token. It typically contains the user's unique identifier (sub), email, and username. The 'sub' claim is a standard JWT claim that stands for "subject" and is commonly used to store the user ID. The email and username fields are included for convenience, but they can be omitted if you prefer to fetch this information from the database when needed.
 * 
 * @example
 * const payload: AccessTokenPayload = {
 *   sub: "12345",
 *   email: "user@example.com",
 *   username: "john_doe"
 * };

 */
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
