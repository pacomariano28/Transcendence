// crypto allows us to generate randomized and crypted value
// math random but in steroids
import crypto from "crypto";

// We create this structure to define what are we going to save in the DB
// It allows us to ask:
// This refreshToken exists?
// Who owns it?
// It expired?
// When DB is implemented, maybe change this :MOD
/**
 * type RefreshRecord = {
  tokenHash: string;
  userId: string;
  expiresAt: number;
  revokedAt?: number | null;
};
 */
type RefreshRecord = {
  userId: string;
  expiresAt: number; // epoch ms
};

// And this one is to define what are we returning when we create a new Token
type IssuedRefreshToken = {
  refreshToken: string;
  expiresAt: number;
};

// :MOD
// we use this as a temp DB, we should remove it when Redis is ready
const store = new Map<string, RefreshRecord>();

// 30 days
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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
export function issueRefreshToken(userId: string): IssuedRefreshToken {
  const refreshToken = crypto.randomBytes(48).toString("hex");
  const expiresAt = Date.now() + REFRESH_TTL_MS;

  // :MOD
  // store de relation between token and user
  store.set(refreshToken, { userId, expiresAt });

  return { refreshToken, expiresAt };
}

// Consume the refreshToken and get userId
export function consumeRefreshToken(refreshToken: string): { userId: string } {
  // MOD: get the token from the map. We have to get it from the DB/Redis
  const rec = store.get(refreshToken);

  if (!rec) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  // its expired?
  if (Date.now() > rec.expiresAt) {
    store.delete(refreshToken);
    throw new Error("EXPIRED_REFRESH_TOKEN");
  }

  // Consume the token
  store.delete(refreshToken);

  // we need to create a new refreshToken to the user

  return { userId: rec.userId };
}
