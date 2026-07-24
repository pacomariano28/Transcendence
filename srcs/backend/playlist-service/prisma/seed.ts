import { PrismaClient } from "@prisma/client";
import process from "node:process";
const prisma = new PrismaClient();

async function main() {
  await prisma.song.deleteMany();

  await prisma.song.createMany({
    data: [
      {
        isrc: "USDXS1806044",
        fileName: "preview_001.mp3",
      },
      {
        isrc: "USXDR1700562",
        fileName: "preview_002.mp3",
      },
      {
        isrc: "QZS1Z1600275",
        fileName: "preview_003.mp3",
      },
      {
        isrc: "TCACS1630643",
        fileName: "preview_006.mp3",
      },
      {
        isrc: "GXD7V2653123",
        fileName: "preview_007.mp3",
      },
      {
        isrc: "USSD11500124",
        fileName: "preview_008.mp3",
      },
      {
        isrc: "USA2P2331985",
        fileName: "preview_009.mp3",
      },
      {
        isrc: "QMFME2462255",
        fileName: "preview_010.mp3",
      },
      {
        isrc: "QM6P41962776",
        fileName: "preview_011.mp3",
      },
      {
        isrc: "USDXS1700004",
        fileName: "preview_012.mp3",
      },
      {
        isrc: "USB271700107",
        fileName: "preview_013.mp3",
      },
      {
        isrc: "USUYG1313832",
        fileName: "preview_014.mp3",
      },
      {
        isrc: "USSD11600232",
        fileName: "preview_015.mp3",
      },
      {
        isrc: "USSD11500321",
        fileName: "preview_016.mp3",
      },
      {
        isrc: "QMFMF2447060",
        fileName: "preview_017.mp3",
      },
      {
        isrc: "QMFMF2216359",
        fileName: "preview_019.mp3",
      },
      {
        isrc: "USSD11800083",
        fileName: "preview_020.mp3",
      },
      {
        isrc: "USSD11700288",
        fileName: "preview_021.mp3",
      },
      {
        isrc: "TCADD1756289",
        fileName: "preview_022.mp3",
      },
      {
        isrc: "USDXS1500229",
        fileName: "preview_023.mp3",
      },
      {
        isrc: "QMFMF2447067",
        fileName: "preview_024.mp3",
      },
      {
        isrc: "QM4TX1838235",
        fileName: "preview_025.mp3",
      },
      {
        isrc: "USUYG1499990",
        fileName: "preview_026.mp3",
      },
      {
        isrc: "QM4TW2165659",
        fileName: "preview_027.mp3",
      },
      {
        isrc: "QM4TW1987698",
        fileName: "preview_028.mp3",
      },
      {
        isrc: "TCACQ1672467",
        fileName: "preview_029.mp3",
      },
      {
        isrc: "USXDR1600032",
        fileName: "preview_030.mp3",
      },
      {
        isrc: "QM6P42334528",
        fileName: "preview_031.mp3",
      },
      {
        isrc: "QMDA72252608",
        fileName: "preview_032.mp3",
      },
      {
        isrc: "TCACL1632533",
        fileName: "preview_033.mp3",
      },
      {
        isrc: "QZZ3N2400083",
        fileName: "preview_034.mp3",
      },
      {
        isrc: "USUM72209716",
        fileName: "preview_035.mp3",
      },
      {
        isrc: "US7VG1706909",
        fileName: "preview_036.mp3",
      },
      {
        isrc: "MXF152100594",
        fileName: "preview_037.mp3",
      },
      {
        isrc: "CA5KR1701303",
        fileName: "preview_039.mp3",
      },
      {
        isrc: "USUM71703012",
        fileName: "preview_041.mp3",
      },
      {
        isrc: "USSD11300465",
        fileName: "preview_042.mp3",
      },
      {
        isrc: "TCACT1634712",
        fileName: "preview_043.mp3",
      },
      {
        isrc: "USWL12506391",
        fileName: "preview_044.mp3",
      },
      {
        isrc: "QMFME2066845",
        fileName: "preview_045.mp3",
      },
      {
        isrc: "USUM71911619",
        fileName: "preview_047.mp3",
      },
      {
        isrc: "TCAAZ1167850",
        fileName: "preview_048.mp3",
      },
      {
        isrc: "QM4TW2040254",
        fileName: "preview_049.mp3",
      },
      {
        isrc: "USUM72215366",
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
