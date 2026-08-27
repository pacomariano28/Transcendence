-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "isrc" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Song_fileName_key" ON "Song"("fileName");
