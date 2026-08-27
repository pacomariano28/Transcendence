-- Per-playlist track usage rotation for lobby playlist prep.
CREATE TABLE "PlaylistTrackUsage" (
    "id" TEXT NOT NULL,
    "playlistKey" TEXT NOT NULL,
    "isrc" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaylistTrackUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlaylistTrackUsage_playlistKey_isrc_key" ON "PlaylistTrackUsage"("playlistKey", "isrc");
CREATE INDEX "PlaylistTrackUsage_playlistKey_used_idx" ON "PlaylistTrackUsage"("playlistKey", "used");
