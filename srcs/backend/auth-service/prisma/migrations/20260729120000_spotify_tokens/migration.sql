-- AlterTable
ALTER TABLE "SpotifyProfile" ADD COLUMN IF NOT EXISTS "accessTokenEnc" TEXT;
ALTER TABLE "SpotifyProfile" ADD COLUMN IF NOT EXISTS "refreshTokenEnc" TEXT;
ALTER TABLE "SpotifyProfile" ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "SpotifyProfile" ADD COLUMN IF NOT EXISTS "tokenScope" TEXT;
