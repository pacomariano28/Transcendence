import crypto from "crypto";
import { prisma } from "./prisma.js";

/**
 * @description
 * This type represents the structure of an issued refresh token, including the token itself and its expiration time.
 * The `refreshToken` is a string that can be used to obtain a new access token when the current access token expires.
 * The `expiresAt` property indicates when the refresh token will expire, allowing the system to determine if the token is still valid or if it needs to be renewed.
 */
type IssuedRefreshToken = {
  refreshToken: string;
  expiresAt: number;
};

// 30 days
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * @brief Hashes a refresh token using SHA-256.
 *
 * @description
 * This function takes a refresh token as input and returns its SHA-256 hash. Hashing the token before storing it in the database adds an extra layer of security, ensuring that even if the database is compromised, the actual tokens cannot be easily retrieved or misused.
 * @param token
 * @returns The SHA-256 hash of the provided refresh token.
 *
 * @example
 * const token = "my-refresh-token";
 * const hashedToken = hashToken(token);
 * console.log("Hashed Token:", hashedToken);
 */
function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * @brief Issue a new refresh token for a given user ID.
 *
 * @description
 * This function generates a new refresh token for the specified user ID. The refresh token is created as a random string using the crypto library and is associated with an expiration time. The token and its metadata are stored in a temporary in-memory store (which should be replaced with a persistent storage solution like a database or Redis in production).
 * @param userId
 * @returns An object containing the issued refresh token and its expiration time.
 *
 * @example
 * const { refreshToken, expiresAt } = issueRefreshToken("12345");
 * console.log("Issued Refresh Token:", refreshToken);
 * console.log("Expires At:", new Date(expiresAt).toISOString());
 */
export async function issueRefreshToken(userId: string): Promise<IssuedRefreshToken> {
  const refreshToken = crypto.randomBytes(48).toString("hex");
  const expiresAt = Date.now() + REFRESH_TTL_MS;

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt: new Date(expiresAt),
    },
  });

  return { refreshToken, expiresAt };
}

/**
 * @brief Consume a refresh token to obtain the associated user ID.
 *
 * @description
 * This function takes a refresh token as input and checks if it exists in the database. If the token is valid and has not expired, it marks the token as consumed (revoked) and returns the associated user ID. If the token is invalid, expired, or already revoked, it throws an appropriate error.
 * @param refreshToken
 * @returns An object containing the user ID associated with the consumed refresh token.
 *
 * @example
 * try {
 *   const { userId } = await consumeRefreshToken("some-refresh-token");
 *   console.log("User ID:", userId);
 * } catch (error) {
 *   console.error("Error consuming refresh token:", error.message);
 * }
 */
export async function consumeRefreshToken(refreshToken: string): Promise<{ userId: string }> {
  const tokenHash = hashToken(refreshToken);
  const now = new Date();

  // Atomic consume (prevents race conditions):
  // only one request can flip revokedAt from null -> now for a non-expired token
  const consumed = await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    data: { revokedAt: now },
  });

  if (consumed.count !== 1) {
    // Covers: not found, already revoked/consumed, expired
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const rec = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    select: { userId: true },
  });

  if (!rec) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  return { userId: rec.userId };
}
