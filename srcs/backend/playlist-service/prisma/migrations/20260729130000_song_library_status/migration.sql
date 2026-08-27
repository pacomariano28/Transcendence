-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "SongStatus" AS ENUM ('pending', 'ready', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable: add new columns
ALTER TABLE "Song" ADD COLUMN IF NOT EXISTS "spotifyTrackId" TEXT;
ALTER TABLE "Song" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Song" ADD COLUMN IF NOT EXISTS "artist" TEXT;
ALTER TABLE "Song" ADD COLUMN IF NOT EXISTS "status" "SongStatus" NOT NULL DEFAULT 'ready';
ALTER TABLE "Song" ADD COLUMN IF NOT EXISTS "failReason" TEXT;
ALTER TABLE "Song" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'seed';

-- Make fileName nullable for pending songs
ALTER TABLE "Song" ALTER COLUMN "fileName" DROP NOT NULL;

-- Unique ISRC (drop duplicates first if any — keep earliest)
DELETE FROM "Song" a USING "Song" b
WHERE a.id > b.id AND a.isrc = b.isrc;

CREATE UNIQUE INDEX IF NOT EXISTS "Song_isrc_key" ON "Song"("isrc");
