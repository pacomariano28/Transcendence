import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma.js";
import { mediaFileExists } from "../lib/mediaFiles.js";

export type EnsureTrackInput = {
  isrc: string;
  title?: string | null;
  artist?: string | null;
  spotifyTrackId?: string | null;
};

export type EnsureTrackResult = {
  isrc: string;
  status: "ready" | "pending" | "failed";
  fileName: string | null;
  failReason: string | null;
};

const MEDIA_DIR =
  process.env.MEDIA_DIR || "/media";
const inFlight = new Set<string>();

function safeFileName(isrc: string): string {
  const hash = isrc.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
  return `clip_${hash}.mp3`;
}

function runCommand(
  command: string,
  args: string[],
  timeoutMs = 120_000,
): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({ code: 1, stderr: stderr || "TIMEOUT" });
    }, timeoutMs);

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stderr });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ code: 1, stderr: err.message });
    });
  });
}

async function toolsAvailable(): Promise<boolean> {
  const yt = await runCommand("yt-dlp", ["--version"], 5_000);
  const ff = await runCommand("ffmpeg", ["-version"], 5_000);
  return yt.code === 0 && ff.code === 0;
}

/**
 * Best-effort clip generation from t=0 using yt-dlp + ffmpeg.
 * Experimental — may fail if tools/media volume are missing.
 */
async function generateClip(track: EnsureTrackInput): Promise<void> {
  const search = [track.title, track.artist].filter(Boolean).join(" ").trim();
  if (!search) {
    await prisma.song.update({
      where: { isrc: track.isrc },
      data: {
        status: "failed",
        failReason: "MISSING_TITLE_ARTIST",
      },
    });
    return;
  }

  if (!(await toolsAvailable())) {
    await prisma.song.update({
      where: { isrc: track.isrc },
      data: {
        status: "failed",
        failReason: "CLIP_TOOLS_UNAVAILABLE",
      },
    });
    return;
  }

  try {
    await fs.mkdir(MEDIA_DIR, { recursive: true });
  } catch {
    await prisma.song.update({
      where: { isrc: track.isrc },
      data: { status: "failed", failReason: "MEDIA_DIR_UNAVAILABLE" },
    });
    return;
  }

  const fileName = safeFileName(track.isrc);
  const outPath = path.join(MEDIA_DIR, fileName);
  const tmpFull = path.join(MEDIA_DIR, `tmp_full_${track.isrc}.mp3`);

  const download = await runCommand(
    "yt-dlp",
    [
      "-x",
      "--audio-format",
      "mp3",
      "--quiet",
      "--no-warnings",
      `ytsearch1:${search}`,
      "-o",
      tmpFull,
    ],
    180_000,
  );

  if (download.code !== 0) {
    await prisma.song.update({
      where: { isrc: track.isrc },
      data: {
        status: "failed",
        failReason: `YTDLP_FAILED:${download.stderr.slice(0, 200)}`,
      },
    });
    await fs.unlink(tmpFull).catch(() => undefined);
    return;
  }

  const clip = await runCommand(
    "ffmpeg",
    ["-y", "-i", tmpFull, "-ss", "0", "-t", "20", "-acodec", "libmp3lame", outPath],
    60_000,
  );

  await fs.unlink(tmpFull).catch(() => undefined);

  if (clip.code !== 0) {
    await prisma.song.update({
      where: { isrc: track.isrc },
      data: {
        status: "failed",
        failReason: `FFMPEG_FAILED:${clip.stderr.slice(0, 200)}`,
      },
    });
    await fs.unlink(outPath).catch(() => undefined);
    return;
  }

  await prisma.song.update({
    where: { isrc: track.isrc },
    data: {
      status: "ready",
      fileName,
      failReason: null,
      source: "clip-worker",
      title: track.title ?? undefined,
      artist: track.artist ?? undefined,
      spotifyTrackId: track.spotifyTrackId ?? undefined,
    },
  });
}

function enqueueClip(track: EnsureTrackInput): void {
  if (inFlight.has(track.isrc)) return;
  inFlight.add(track.isrc);

  void generateClip(track)
    .catch((err) => {
      console.error(`[clip-worker] Failed for ${track.isrc}`, err);
    })
    .finally(() => {
      inFlight.delete(track.isrc);
    });
}

/**
 * Ensures library rows exist for the given tracks and kicks off clip jobs for missing audio.
 */
export async function ensureTracks(
  tracks: EnsureTrackInput[],
): Promise<EnsureTrackResult[]> {
  const results: EnsureTrackResult[] = [];

  for (const track of tracks) {
    const isrc = track.isrc?.trim();
    if (!isrc) continue;

    let song = await prisma.song.findUnique({ where: { isrc } });

    if (!song) {
      song = await prisma.song.create({
        data: {
          isrc,
          status: "pending",
          fileName: null,
          title: track.title ?? null,
          artist: track.artist ?? null,
          spotifyTrackId: track.spotifyTrackId ?? null,
          source: "clip-worker",
        },
      });
      enqueueClip({ ...track, isrc });
    } else if (song.status === "pending") {
      enqueueClip({
        isrc,
        title: track.title ?? song.title,
        artist: track.artist ?? song.artist,
        spotifyTrackId: track.spotifyTrackId ?? song.spotifyTrackId,
      });
    } else if (song.status === "ready" && song.fileName) {
      const fileStillExists = await mediaFileExists(song.fileName);
      if (!fileStillExists) {
        await prisma.song.update({
          where: { isrc },
          data: { status: "pending", fileName: null, failReason: null },
        });
        enqueueClip({
          isrc,
          title: track.title ?? song.title,
          artist: track.artist ?? song.artist,
          spotifyTrackId: track.spotifyTrackId ?? song.spotifyTrackId,
        });
        song = { ...song, status: "pending", fileName: null };
      }
    } else if (song.status === "failed" && track.title) {
      // Allow one retry when new metadata arrives.
      await prisma.song.update({
        where: { isrc },
        data: {
          status: "pending",
          failReason: null,
          title: track.title ?? song.title,
          artist: track.artist ?? song.artist,
        },
      });
      song = { ...song, status: "pending" };
      enqueueClip({ ...track, isrc });
    }

    results.push({
      isrc,
      status: song.status as EnsureTrackResult["status"],
      fileName: song.fileName,
      failReason: song.failReason,
    });
  }

  // Re-read to return fresh statuses for pending that might have finished instantly (cache hit path).
  const isrcs = results.map((r) => r.isrc);
  const fresh = await prisma.song.findMany({ where: { isrc: { in: isrcs } } });
  const byIsrc = new Map(fresh.map((s) => [s.isrc, s]));

  return results.map((r) => {
    const song = byIsrc.get(r.isrc);
    if (!song) return r;
    return {
      isrc: song.isrc,
      status: song.status as EnsureTrackResult["status"],
      fileName: song.fileName,
      failReason: song.failReason,
    };
  });
}
