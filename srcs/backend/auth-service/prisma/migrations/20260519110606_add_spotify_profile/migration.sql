-- CreateTable
CREATE TABLE "SpotifyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotifyUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "topArtists" JSONB NOT NULL,
    "topGenres" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotifyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyProfile_userId_key" ON "SpotifyProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyProfile_spotifyUserId_key" ON "SpotifyProfile"("spotifyUserId");

-- AddForeignKey
ALTER TABLE "SpotifyProfile" ADD CONSTRAINT "SpotifyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
