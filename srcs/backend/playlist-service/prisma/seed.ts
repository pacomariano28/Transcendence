import { PrismaClient } from "@prisma/client";
import process from "node:process";
const prisma = new PrismaClient();

async function main() {
  await prisma.song.deleteMany();

  await prisma.song.createMany({
    data: [
      {
        trackId: "3QFInJAm9eyaho5vBzxInN",
        fileName: "preview_001.mp3",
      },
      {
        trackId: "760IJcunfpbkm6sHbMmyyj",
        fileName: "preview_002.mp3",
      },
      {
        trackId: "5TRPicyLGbAF2LGBFbHGvO",
        fileName: "preview_003.mp3",
      },
      {
        trackId: "68Dni7IE4VyPkTOH9mRWHr",
        fileName: "preview_004.mp3",
      },
      {
        trackId: "51EC3I1nQXpec4gDk0mQyP",
        fileName: "preview_005.mp3",
      },
      {
        trackId: "2N3U8uTYhjX2KwGT0pf5x0",
        fileName: "preview_006.mp3",
      },
      {
        trackId: "60PAzFNW3vAiAiVK6DRJfB",
        fileName: "preview_007.mp3",
      },
      {
        trackId: "30QR0ndUdiiMQMA9g1PGCm",
        fileName: "preview_008.mp3",
      },
      {
        trackId: "3yk7PJnryiJ8mAPqsrujzf",
        fileName: "preview_009.mp3",
      },
      {
        trackId: "2axiRrUWmlFUKmPzDsjjzg",
        fileName: "preview_010.mp3",
      },
      {
        trackId: "50a8bKqlwDEqeiEknrzkTO",
        fileName: "preview_011.mp3",
      },
      {
        trackId: "6IZvVAP7VPPnsGX6bvgkqg",
        fileName: "preview_012.mp3",
      },
      {
        trackId: "58k32my5lKofeZRtIvBDg9",
        fileName: "preview_013.mp3",
      },
      {
        trackId: "0fv2KH6hac06J86hBUTcSf",
        fileName: "preview_014.mp3",
      },
      {
        trackId: "4aOOExMBUyxKnEYb39SrTg",
        fileName: "preview_015.mp3",
      },
      {
        trackId: "5bJ1DrEM4hNCafcDd1oxHx",
        fileName: "preview_016.mp3",
      },
      {
        trackId: "3s7MCdXyWmwjdcWh7GWXas",
        fileName: "preview_017.mp3",
      },
      {
        trackId: "393MDhe62s8hbH8ETrlxe5",
        fileName: "preview_018.mp3",
      },
      {
        trackId: "6LyAwkJsHlW7RQ8S1cYAtM",
        fileName: "preview_019.mp3",
      },
      {
        trackId: "5n4FTCMefvyKUjeWumdaWv",
        fileName: "preview_020.mp3",
      },
      {
        trackId: "4tqcoej1zPvwePZCzuAjJd",
        fileName: "preview_021.mp3",
      },
      {
        trackId: "3vQ4T78TTMOjQXGfXVKQJo",
        fileName: "preview_022.mp3",
      },
      {
        trackId: "0zO8ctW0UiuOefR87OeJOZ",
        fileName: "preview_023.mp3",
      },
      {
        trackId: "0uxSUdBrJy9Un0EYoBowng",
        fileName: "preview_024.mp3",
      },
      {
        trackId: "4lH6nENd1y81jp7Yt9lTBX",
        fileName: "preview_025.mp3",
      },
      {
        trackId: "7J2gyNghNTzl4EsLhXp01Q",
        fileName: "preview_026.mp3",
      },
      {
        trackId: "1Is8hGpkGMiePASAxBluxM",
        fileName: "preview_027.mp3",
      },
      {
        trackId: "7rbECVPkY5UODxoOUVKZnA",
        fileName: "preview_028.mp3",
      },
      {
        trackId: "0m0GzwCkfuFcxOlLjgpudo",
        fileName: "preview_029.mp3",
      },
      {
        trackId: "11kDth1aKUEUMq9r1pqyds",
        fileName: "preview_030.mp3",
      },
      {
        trackId: "29TPjc8wxfz4XMn21O7VsZ",
        fileName: "preview_031.mp3",
      },
      {
        trackId: "7ycWLEP1GsNjVvcjawXz3z",
        fileName: "preview_032.mp3",
      },
      {
        trackId: "0I3q5fE6wg7LIfHGngUTnV",
        fileName: "preview_033.mp3",
      },
      {
        trackId: "0yhMmqax6HRAZxI7udEask",
        fileName: "preview_034.mp3",
      },
      {
        trackId: "7AzlLxHn24DxjgQX73F9fU",
        fileName: "preview_035.mp3",
      },
      {
        trackId: "3azJifCSqg9fRij2yKIbWz",
        fileName: "preview_036.mp3",
      },
      {
        trackId: "6MOst484piqXpzPPRRe8i5",
        fileName: "preview_037.mp3",
      },
      {
        trackId: "5FkoSXiJPKTNyYgALRJFhD",
        fileName: "preview_038.mp3",
      },
      {
        trackId: "2t8yVaLvJ0RenpXUIAC52d",
        fileName: "preview_039.mp3",
      },
      {
        trackId: "1fewSx2d5KIZ04wsooEBOz",
        fileName: "preview_040.mp3",
      },
      {
        trackId: "3DK6m7It6Pw857FcQftMds",
        fileName: "preview_041.mp3",
      },
      {
        trackId: "5hVghJ4KaYES3BFUATCYn0",
        fileName: "preview_042.mp3",
      },
      {
        trackId: "4gh0ZnHzaTMT1sDga7Ek0N",
        fileName: "preview_043.mp3",
      },
      {
        trackId: "6vSRW8utiYAdoCfJG2v86r",
        fileName: "preview_044.mp3",
      },
      {
        trackId: "3iVcZ5G6tvkXZkZKlMpIUs",
        fileName: "preview_045.mp3",
      },
      {
        trackId: "1tm7c4V0kqLiN0XPVnoUcT",
        fileName: "preview_046.mp3",
      },
      {
        trackId: "2G1tXoGBaEMJ7FKGnkf6ud",
        fileName: "preview_047.mp3",
      },
      {
        trackId: "2aPTvyE09vUCRwVvj0I8WK",
        fileName: "preview_048.mp3",
      },
      {
        trackId: "4jvjzW7Hm0yK4LvvE0Paz9",
        fileName: "preview_049.mp3",
      },
      {
        trackId: "2qOm7ukLyHUXWyR4ZWLwxA",
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
