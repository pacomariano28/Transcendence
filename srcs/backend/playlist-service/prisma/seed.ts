import { PrismaClient } from "@prisma/client";
import process from "node:process";
const prisma = new PrismaClient();

async function main() {
  await prisma.song.deleteMany();

  await prisma.song.createMany({
    data: [
      {
        isrc: "QZ5FN1701453",
        fileName: "preview_001.mp3",
      },
      {
        isrc: "QM9WM2100036",
        fileName: "preview_003.mp3",
      },
      {
        isrc: "QM9WM2000134",
        fileName: "preview_004.mp3",
      },
      {
        isrc: "QM7281964587",
        fileName: "preview_005.mp3",
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
