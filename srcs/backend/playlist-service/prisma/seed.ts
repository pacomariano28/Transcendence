import { PrismaClient } from "@prisma/client";
import process from "node:process";
const prisma = new PrismaClient();

async function main() {
  await prisma.song.deleteMany();

  await prisma.song.createMany({
    data: [
      {
        isrc: "QM6P42098443",
        fileName: "preview_001.mp3",
      },
      {
        isrc: "USWL11900184",
        fileName: "preview_002.mp3",
      },
      {
        isrc: "QM6P42321023",
        fileName: "preview_003.mp3",
      },
      {
        isrc: "QZHN92113571",
        fileName: "preview_005.mp3",
      },
      {
        isrc: "QMDA62493509",
        fileName: "preview_006.mp3",
      },
      {
        isrc: "USA2P2206459",
        fileName: "preview_007.mp3",
      },
      {
        isrc: "QM4TX2373187",
        fileName: "preview_008.mp3",
      },
      {
        isrc: "QMDA62468039",
        fileName: "preview_009.mp3",
      },
      {
        isrc: "QM6P42321091",
        fileName: "preview_010.mp3",
      },
      {
        isrc: "AEA0Q1971039",
        fileName: "preview_011.mp3",
      },
      {
        isrc: "ZZOPM2238685",
        fileName: "preview_012.mp3",
      },
      {
        isrc: "QZGLM2055431",
        fileName: "preview_013.mp3",
      },
      {
        isrc: "GBLFP2046032",
        fileName: "preview_014.mp3",
      },
      {
        isrc: "QZTAY2341241",
        fileName: "preview_015.mp3",
      },
      {
        isrc: "QZNWW2245849",
        fileName: "preview_016.mp3",
      },
      {
        isrc: "QM6P42321156",
        fileName: "preview_017.mp3",
      },
      {
        isrc: "USWB12501265",
        fileName: "preview_018.mp3",
      },
      {
        isrc: "ZZOPM2231674",
        fileName: "preview_019.mp3",
      },
      {
        isrc: "ES5022100004",
        fileName: "preview_020.mp3",
      },
      {
        isrc: "USA2P2517243",
        fileName: "preview_021.mp3",
      },
      {
        isrc: "ES6101900631",
        fileName: "preview_022.mp3",
      },
      {
        isrc: "QMDA62527257",
        fileName: "preview_023.mp3",
      },
      {
        isrc: "QM6MZ2312577",
        fileName: "preview_024.mp3",
      },
      {
        isrc: "USWB12405586",
        fileName: "preview_025.mp3",
      },
      {
        isrc: "BK4DA2303467",
        fileName: "preview_026.mp3",
      },
      {
        isrc: "USA2P2464664",
        fileName: "preview_028.mp3",
      },
      {
        isrc: "QM6N22305745",
        fileName: "preview_029.mp3",
      },
      {
        isrc: "BK4DA2207343",
        fileName: "preview_030.mp3",
      },
      {
        isrc: "QM6P42321219",
        fileName: "preview_031.mp3",
      },
      {
        isrc: "QZHN82014576",
        fileName: "preview_032.mp3",
      },
      {
        isrc: "BK4DA2612795",
        fileName: "preview_033.mp3",
      },
      {
        isrc: "ES5022100005",
        fileName: "preview_034.mp3",
      },
      {
        isrc: "USA2P2464670",
        fileName: "preview_035.mp3",
      },
      {
        isrc: "QMDA62175555",
        fileName: "preview_036.mp3",
      },
      {
        isrc: "USWL12000049",
        fileName: "preview_037.mp3",
      },
      {
        isrc: "QM6P42321150",
        fileName: "preview_038.mp3",
      },
      {
        isrc: "USA2P2413977",
        fileName: "preview_039.mp3",
      },
      {
        isrc: "QZK6J2100614",
        fileName: "preview_040.mp3",
      },
      {
        isrc: "ES5022100396",
        fileName: "preview_041.mp3",
      },
      {
        isrc: "ES25E2000023",
        fileName: "preview_042.mp3",
      },
      {
        isrc: "QMDA62109750",
        fileName: "preview_043.mp3",
      },
      {
        isrc: "USWL12200656",
        fileName: "preview_044.mp3",
      },
      {
        isrc: "QMFMF2111287",
        fileName: "preview_046.mp3",
      },
      {
        isrc: "USUM72501265",
        fileName: "preview_047.mp3",
      },
      {
        isrc: "ES5021702169",
        fileName: "preview_048.mp3",
      },
      {
        isrc: "ES75E2407785",
        fileName: "preview_049.mp3",
      },
      {
        isrc: "ES5152600209",
        fileName: "preview_050.mp3",
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
