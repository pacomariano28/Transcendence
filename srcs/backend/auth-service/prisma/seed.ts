import { PrismaClient } from "@prisma/client";
import process from "node:process";
const prisma = new PrismaClient();

async function main() {
  await prisma.song.createMany({
    data: [
      {
        fileName: "song_001.mp3",
        title: "Smells Like Teen Spirit",
        artist: "Nirvana",
        genre: "rock",
      },
      {
        fileName: "song_002.mp3",
        title: "Lose Yourself",
        artist: "Eminem",
        genre: "hiphop",
      },
      {
        fileName: "song_003.mp3",
        title: "Bohemian Rhapsody",
        artist: "Queen",
        genre: "rock",
      },
      {
        fileName: "song_004.mp3",
        title: "Blinding Lights",
        artist: "The Weeknd",
        genre: "pop",
      },
      {
        fileName: "song_005.mp3",
        title: "Hello",
        artist: "Adele",
        genre: "pop",
      },
    ],
  });
  console.log("Seeded 5 songs!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
