import { PrismaClient } from "@prisma/client";
import process from "node:process";
const prisma = new PrismaClient();

async function main() {
  await prisma.song.deleteMany();

  await prisma.song.createMany({
    data: [
      {
        trackId: "3GvDCvfTvXB4cp8wwh7Y3k",
        fileName: "preview_001.mp3",
      },
      {
        trackId: "3ivnBohmIbZFrtzGkSqUtN",
        fileName: "preview_002.mp3",
      },
      {
        trackId: "5V1YyUMhty1NCO3zVePAtR",
        fileName: "preview_003.mp3",
      },
      {
        trackId: "0isjtJAFQqeerWeecGmc1u",
        fileName: "preview_005.mp3",
      },
      {
        trackId: "4Z6pPinNzkGtbgAlE88263",
        fileName: "preview_006.mp3",
      },
      {
        trackId: "2gEthirHCqqUybpq7HkNY7",
        fileName: "preview_007.mp3",
      },
      {
        trackId: "4a2KalFjqxANM6WAfR3sYJ",
        fileName: "preview_008.mp3",
      },
      {
        trackId: "763beEZikxBlbwHvdlCWnh",
        fileName: "preview_009.mp3",
      },
      {
        trackId: "7x011H8oZwGYBuXQQfGpu4",
        fileName: "preview_010.mp3",
      },
      {
        trackId: "6YfQ2Ev74hY6Tsw5q8y2XX",
        fileName: "preview_011.mp3",
      },
      {
        trackId: "64yCeFRhL4hTNik8J3Un6D",
        fileName: "preview_012.mp3",
      },
      {
        trackId: "35hYk23wFUOsHoQfljbz80",
        fileName: "preview_013.mp3",
      },
      {
        trackId: "7zxw2muWhobnpwEdABBO83",
        fileName: "preview_014.mp3",
      },
      {
        trackId: "16RcB6ae7pNeCQVIrPuytu",
        fileName: "preview_015.mp3",
      },
      {
        trackId: "1TWAUx1pXxA5XxJmHMGT0b",
        fileName: "preview_016.mp3",
      },
      {
        trackId: "2TrtWQKmcdoSGjsJDc3N64",
        fileName: "preview_017.mp3",
      },
      {
        trackId: "4YZhsgOBQtKvxZWjVuJD9H",
        fileName: "preview_018.mp3",
      },
      {
        trackId: "0UxAVbd9Fjp7O2SvzV2fJJ",
        fileName: "preview_019.mp3",
      },
      {
        trackId: "3SK45LddxlEkzI8OWO9Eyo",
        fileName: "preview_020.mp3",
      },
      {
        trackId: "0EsMceg5ksKflUYXt2WMne",
        fileName: "preview_021.mp3",
      },
      {
        trackId: "44aqOr4450KjyEZuW9Ekpm",
        fileName: "preview_022.mp3",
      },
      {
        trackId: "712KzUVmtBeFXgJhbMJY5o",
        fileName: "preview_023.mp3",
      },
      {
        trackId: "6m8DnCqkHlUfcjXcjOmOu2",
        fileName: "preview_024.mp3",
      },
      {
        trackId: "0sVAsg0GP4JZHKn1Ohsiw0",
        fileName: "preview_025.mp3",
      },
      {
        trackId: "2UP28r5tYcvHi7ZJIK3DjG",
        fileName: "preview_026.mp3",
      },
      {
        trackId: "22hmwgik7o71IiNVsCMDVF",
        fileName: "preview_028.mp3",
      },
      {
        trackId: "0yK1nUASmGNYKUH5qpXeOY",
        fileName: "preview_029.mp3",
      },
      {
        trackId: "3X7BShvdMM3posr8IDK0J5",
        fileName: "preview_030.mp3",
      },
      {
        trackId: "0ojp3rI6wfc6GjATk2SEir",
        fileName: "preview_031.mp3",
      },
      {
        trackId: "5Vv9KbtAN8XNESS8XH1sPt",
        fileName: "preview_032.mp3",
      },
      {
        trackId: "7LSZyRFY3SzFFocAGnyJXV",
        fileName: "preview_033.mp3",
      },
      {
        trackId: "740uwCK09xVPNPr4hFpcWW",
        fileName: "preview_034.mp3",
      },
      {
        trackId: "5Bng1Bwy7PFQys6qByKmdT",
        fileName: "preview_035.mp3",
      },
      {
        trackId: "0bxzF2Kyql0pQ58Mymztue",
        fileName: "preview_036.mp3",
      },
      {
        trackId: "3J07YIMTnaBv4p6QerX7hT",
        fileName: "preview_037.mp3",
      },
      {
        trackId: "1Hrucz5n0cjYuPApCk8VkL",
        fileName: "preview_038.mp3",
      },
      {
        trackId: "2KM7hci1ohUILFerXvGUrO",
        fileName: "preview_039.mp3",
      },
      {
        trackId: "6d4l6gEGNVRJTgrYzGAlpR",
        fileName: "preview_040.mp3",
      },
      {
        trackId: "5py3FJrHEuR67BjR7wm8uj",
        fileName: "preview_041.mp3",
      },
      {
        trackId: "6z8F2qpz1zM5ehf0tVFAPu",
        fileName: "preview_042.mp3",
      },
      {
        trackId: "3lI1sZnyM1Ju3ApgNo0ITT",
        fileName: "preview_043.mp3",
      },
      {
        trackId: "3O6qgosmTPliBdsuCIOqMh",
        fileName: "preview_044.mp3",
      },
      {
        trackId: "10uuINeqxckcD70rf1h4rg",
        fileName: "preview_046.mp3",
      },
      {
        trackId: "7Bczytfc62eccD7kSqSnFh",
        fileName: "preview_047.mp3",
      },
      {
        trackId: "3xNMMrXGcFIg06FfTVxod9",
        fileName: "preview_048.mp3",
      },
      {
        trackId: "3KwHAXvJ3XpIFynhiB54iB",
        fileName: "preview_049.mp3",
      },
      {
        trackId: "3ymDF1SxC4c8i0GUZN3Mg2",
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
