import { PrismaClient } from "@prisma/client";
import process from "node:process";
const prisma = new PrismaClient();

async function main() {
  await prisma.song.deleteMany();

  await prisma.song.createMany({
    data: [
      {
        isrc: "QM9WM2100036",
        fileName: "preview_001.mp3",
      },
      {
        isrc: "QM9WM2000134",
        fileName: "preview_002.mp3",
      },
      {
        isrc: "QM9WM1900108",
        fileName: "preview_003.mp3",
      },
      {
        isrc: "QM9WM1900166",
        fileName: "preview_004.mp3",
      },
      {
        isrc: "QM6P41962776",
        fileName: "preview_005.mp3",
      },
      {
        isrc: "QM4TX1920224",
        fileName: "preview_006.mp3",
      },
      {
        isrc: "QM4TX1940916",
        fileName: "preview_007.mp3",
      },
      {
        isrc: "QMBZ91995668",
        fileName: "preview_008.mp3",
      },
      {
        isrc: "USRC11803252",
        fileName: "preview_009.mp3",
      },
    ],
  });
  console.log("Seeded songs!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
