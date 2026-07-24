import { PrismaClient } from "@prisma/client";
import process from "node:process";
const prisma = new PrismaClient();

async function main() {
  await prisma.song.deleteMany();

  await prisma.song.createMany({
    data: [
      {
        isrc: "USGF19942501",
        fileName: "preview_001.mp3",
      },
      {
        isrc: "USMC19959123",
        fileName: "preview_002.mp3",
      },
      {
        isrc: "USA176610020",
        fileName: "preview_003.mp3",
      },
      {
        isrc: "AUAP07900028",
        fileName: "preview_004.mp3",
      },
      {
        isrc: "USEW17500002",
        fileName: "preview_005.mp3",
      },
      {
        isrc: "AUAP08000046",
        fileName: "preview_006.mp3",
      },
      {
        isrc: "GBUM71505902",
        fileName: "preview_007.mp3",
      },
      {
        isrc: "USGF18714809",
        fileName: "preview_008.mp3",
      },
      {
        isrc: "AUAP07600012",
        fileName: "preview_009.mp3",
      },
      {
        isrc: "USSM17600644",
        fileName: "preview_010.mp3",
      },
      {
        isrc: "AUXN21001428",
        fileName: "preview_011.mp3",
      },
      {
        isrc: "USGF19142004",
        fileName: "preview_012.mp3",
      },
      {
        isrc: "USGF19141504",
        fileName: "preview_013.mp3",
      },
      {
        isrc: "GBUM71029610",
        fileName: "preview_014.mp3",
      },
      {
        isrc: "USIR10000454",
        fileName: "preview_015.mp3",
      },
      {
        isrc: "USAT21300959",
        fileName: "preview_016.mp3",
      },
      {
        isrc: "AUXN21001429",
        fileName: "preview_017.mp3",
      },
      {
        isrc: "GBCEE9300020",
        fileName: "preview_018.mp3",
      },
      {
        isrc: "GBUM71029607",
        fileName: "preview_019.mp3",
      },
      {
        isrc: "GBCEE9400035",
        fileName: "preview_020.mp3",
      },
      {
        isrc: "USGF19141510",
        fileName: "preview_021.mp3",
      },
      {
        isrc: "USPR39609092",
        fileName: "preview_022.mp3",
      },
      {
        isrc: "USAT21300957",
        fileName: "preview_024.mp3",
      },
      {
        isrc: "USPR37509157",
        fileName: "preview_025.mp3",
      },
      {
        isrc: "USRH11505155",
        fileName: "preview_027.mp3",
      },
      {
        isrc: "USPR39330175",
        fileName: "preview_028.mp3",
      },
      {
        isrc: "USMR18210013",
        fileName: "preview_029.mp3",
      },
      {
        isrc: "USAT29900476",
        fileName: "preview_030.mp3",
      },
      {
        isrc: "USPR38700083",
        fileName: "preview_032.mp3",
      },
      {
        isrc: "USAT29900534",
        fileName: "preview_033.mp3",
      },
      {
        isrc: "USGF18714806",
        fileName: "preview_034.mp3",
      },
      {
        isrc: "USSM10011897",
        fileName: "preview_035.mp3",
      },
      {
        isrc: "USSM19906481",
        fileName: "preview_036.mp3",
      },
      {
        isrc: "USIR10000426",
        fileName: "preview_037.mp3",
      },
      {
        isrc: "USSM19801545",
        fileName: "preview_038.mp3",
      },
      {
        isrc: "USAT21205843",
        fileName: "preview_039.mp3",
      },
      {
        isrc: "GBCEE9800022",
        fileName: "preview_040.mp3",
      },
      {
        isrc: "AUDD31502193",
        fileName: "preview_042.mp3",
      },
      {
        isrc: "USEE10180675",
        fileName: "preview_043.mp3",
      },
      {
        isrc: "USWB11403680",
        fileName: "preview_045.mp3",
      },
      {
        isrc: "USAT20000548",
        fileName: "preview_046.mp3",
      },
      {
        isrc: "NLAX60724472",
        fileName: "preview_047.mp3",
      },
      {
        isrc: "GBFFP0300052",
        fileName: "preview_048.mp3",
      },
      {
        isrc: "USIR10000463",
        fileName: "preview_049.mp3",
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
