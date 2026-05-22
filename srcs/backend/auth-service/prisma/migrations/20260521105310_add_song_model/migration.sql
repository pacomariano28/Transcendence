-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT PRIMARY KEY,
    "trackId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Song_fileName_key" ON "Song"("fileName");
