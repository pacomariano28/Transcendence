import { PrismaClient } from "@prisma/client";
import process from "node:process";
const prisma = new PrismaClient();

async function main() {
  await prisma.song.deleteMany();

  await prisma.song.createMany({
    data: [
      {
        isrc: "ARF112200051",
        fileName: "preview_001.mp3",
      },
      {
        isrc: "USWL12302753",
        fileName: "preview_002.mp3",
      },
      {
        isrc: "QM6MZ2214878",
        fileName: "preview_003.mp3",
      },
      {
        isrc: "QMFME2364189",
        fileName: "preview_004.mp3",
      },
      {
        isrc: "USWL12301086",
        fileName: "preview_005.mp3",
      },
      {
        isrc: "NLB630100326",
        fileName: "preview_006.mp3",
      },
      {
        isrc: "USUM72222551",
        fileName: "preview_007.mp3",
      },
      {
        isrc: "UYB282301041",
        fileName: "preview_008.mp3",
      },
      {
        isrc: "QZK6J2296117",
        fileName: "preview_009.mp3",
      },
      {
        isrc: "TCAGM2208561",
        fileName: "preview_010.mp3",
      },
      {
        isrc: "QZDYA1800087",
        fileName: "preview_011.mp3",
      },
      {
        isrc: "USAT21403439",
        fileName: "preview_012.mp3",
      },
      {
        isrc: "QZW9N2230661",
        fileName: "preview_013.mp3",
      },
      {
        isrc: "USSM12301258",
        fileName: "preview_014.mp3",
      },
      {
        isrc: "USUM71814888",
        fileName: "preview_015.mp3",
      },
      {
        isrc: "GBBBN8300002",
        fileName: "preview_016.mp3",
      },
      {
        isrc: "TCAGU2367052",
        fileName: "preview_017.mp3",
      },
      {
        isrc: "MXF018801022",
        fileName: "preview_018.mp3",
      },
      {
        isrc: "QM24S2302185",
        fileName: "preview_019.mp3",
      },
      {
        isrc: "ES5088500348",
        fileName: "preview_020.mp3",
      },
      {
        isrc: "USUM72302538",
        fileName: "preview_021.mp3",
      },
      {
        isrc: "QM24S2102952",
        fileName: "preview_022.mp3",
      },
      {
        isrc: "USUG12305255",
        fileName: "preview_023.mp3",
      },
      {
        isrc: "USUG12305257",
        fileName: "preview_024.mp3",
      },
      {
        isrc: "USUM72024485",
        fileName: "preview_025.mp3",
      },
      {
        isrc: "QMFME2364195",
        fileName: "preview_026.mp3",
      },
      {
        isrc: "GBGLW2300286",
        fileName: "preview_027.mp3",
      },
      {
        isrc: "FR8GV1838010",
        fileName: "preview_028.mp3",
      },
      {
        isrc: "QZES72201359",
        fileName: "preview_029.mp3",
      },
      {
        isrc: "ES5021800572",
        fileName: "preview_030.mp3",
      },
      {
        isrc: "ES5021800323",
        fileName: "preview_031.mp3",
      },
      {
        isrc: "USSM12109219",
        fileName: "preview_032.mp3",
      },
      {
        isrc: "USSM12109224",
        fileName: "preview_033.mp3",
      },
      {
        isrc: "USSM12109229",
        fileName: "preview_034.mp3",
      },
      {
        isrc: "USQ4E2100678",
        fileName: "preview_035.mp3",
      },
      {
        isrc: "GBCNR8500002",
        fileName: "preview_036.mp3",
      },
      {
        isrc: "USEP41948003",
        fileName: "preview_037.mp3",
      },
      {
        isrc: "USSM12504035",
        fileName: "preview_038.mp3",
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
