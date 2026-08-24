import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma.js";
import { mediaFileExists } from "../lib/mediaFiles.js";
import { logError } from "../lib/logger.js";

export type EnsureTrackInput = {
  isrc: string;
  title?: string | null;
  artist?: string | null;
  spotifyTrackId?: string | null;
  durationMs?: number | null;
};

export type EnsureTrackResult = {
  isrc: string;
  status: "ready" | "pending" | "failed";
  fileName: string | null;
  failReason: string | null;
};

const MEDIA_DIR = process.env.MEDIA_DIR || "/media";
const CLIP_DURATION_SECONDS = 20;
const MAX_CONCURRENT_CLIPS = Number(process.env.MAX_CONCURRENT_CLIPS ?? 6);
const YTDLP_PARTIAL_TIMEOUT_MS = 45_000;
const YTDLP_FULL_TIMEOUT_MS = 90_000;
const FFMPEG_TRIM_TIMEOUT_MS = 30_000;
const FFMPEG_REMUX_TIMEOUT_MS = 30_000;
const YTDLP_AUDIO_FORMAT = "ba[ext=m4a]/ba/bestaudio/best";
const YTDLP_MAX_DOWNLOADS_REACHED = 101;
const CLIP_DOWNLOAD_ATTEMPTS = 2;
const CLIP_RETRY_DELAY_MS = 400;
const DURATION_TOLERANCE_SECONDS = 5;
const FALLBACK_MIN_DURATION_SECONDS = 60;
const FALLBACK_MAX_DURATION_SECONDS = 600;

const inFlight = new Set<string>();
const clipQueue: EnsureTrackInput[] = [];
let activeClipJobs = 0;
let clipToolsAvailable: boolean | null = null;
let clipToolsCheckedAt = 0;
const CLIP_TOOLS_CACHE_MS = 5 * 60_000;

function clipNumberBase(clipNumber: number): string {
  return `clip_${String(clipNumber).padStart(6, "0")}`;
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
  const now = Date.now();
  if (
    clipToolsAvailable !== null &&
    now - clipToolsCheckedAt < CLIP_TOOLS_CACHE_MS
  ) {
    return clipToolsAvailable;
  }

  const yt = await runCommand("yt-dlp", ["--version"], 5_000);
  const ff = await runCommand("ffmpeg", ["-version"], 5_000);
  clipToolsAvailable = yt.code === 0 && ff.code === 0;
  clipToolsCheckedAt = now;
  return clipToolsAvailable;
}

async function allocateClipNumber(): Promise<number> {
  const row = await prisma.clipCounter.create({ data: {} });
  return row.id;
}

async function findClipFileByNumber(
  clipNumber: number,
): Promise<string | null> {
  const base = clipNumberBase(clipNumber);
  const prefix = `${base}.`;
  const files = await fs.readdir(MEDIA_DIR);
  return files.find((file) => file.startsWith(prefix)) ?? null;
}

async function findTempDownload(stem: string): Promise<string | null> {
  const prefix = `${stem}.`;
  const files = await fs.readdir(MEDIA_DIR);
  return files.find((file) => file.startsWith(prefix)) ?? null;
}

async function removeFilesByPrefix(prefix: string): Promise<void> {
  const files = await fs.readdir(MEDIA_DIR).catch(() => [] as string[]);
  await Promise.all(
    files
      .filter((file) => file.startsWith(prefix))
      .map((file) =>
        fs.unlink(path.join(MEDIA_DIR, file)).catch(() => undefined),
      ),
  );
}

function sanitizeSearchText(value: string): string {
  return value
    .replace(/["\n\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function primaryArtistName(artist: string | null | undefined): string {
  if (!artist) return "";
  return sanitizeSearchText(artist.split(",")[0] ?? "");
}

/**
 * Prefer Topic-channel audio (best artist match). If duration filtering
 * rejects that hit (short cuts, mixes), fall back to official audio search.
 */
function buildClipSources(track: EnsureTrackInput): string[] {
  const title = sanitizeSearchText(track.title ?? "");
  const artist = primaryArtistName(track.artist);
  if (!title && !artist) return [];

  if (artist && title) {
    return [
      `ytsearch1:${title} ${artist} "topic"`,
      `ytsearch1:${artist} - ${title} Official Audio`,
    ];
  }

  return [`ytsearch1:${artist || title}`];
}

function durationMatchFilter(durationMs?: number | null): string {
  if (
    typeof durationMs === "number" &&
    Number.isFinite(durationMs) &&
    durationMs > 0
  ) {
    const durationSec = Math.round(durationMs / 1000);
    const min = Math.max(30, durationSec - DURATION_TOLERANCE_SECONDS);
    const max = durationSec + DURATION_TOLERANCE_SECONDS;
    return `duration >= ${min} & duration <= ${max} & !is_live`;
  }

  return `duration >= ${FALLBACK_MIN_DURATION_SECONDS} & duration <= ${FALLBACK_MAX_DURATION_SECONDS} & !is_live`;
}

function ytdlpDownloadArgs(options: {
  source: string;
  outputTemplate: string;
  durationMs?: number | null;
  partial: boolean;
}): string[] {
  const args = [
    options.source,
    "--max-downloads",
    "1",
    "--match-filter",
    durationMatchFilter(options.durationMs),
    "-f",
    YTDLP_AUDIO_FORMAT,
    "--no-embed-metadata",
    "--quiet",
    "--no-warnings",
    "--force-ipv4",
    "-x",
    "--audio-format",
    "m4a",
    "-o",
    options.outputTemplate,
  ];

  if (options.partial) {
    args.push("--download-sections", `*0-${CLIP_DURATION_SECONDS}`);
  }

  return args;
}

function ytdlpSucceeded(code: number): boolean {
  return code === 0 || code === YTDLP_MAX_DOWNLOADS_REACHED;
}

async function trimWithFfmpeg(
  inputPath: string,
  outputPath: string,
): Promise<{ code: number; stderr: string }> {
  const copyResult = await runCommand(
    "ffmpeg",
    [
      "-y",
      "-i",
      inputPath,
      "-ss",
      "0",
      "-t",
      String(CLIP_DURATION_SECONDS),
      "-c",
      "copy",
      outputPath,
    ],
    FFMPEG_TRIM_TIMEOUT_MS,
  );

  if (copyResult.code === 0) {
    return copyResult;
  }

  return runCommand(
    "ffmpeg",
    [
      "-y",
      "-i",
      inputPath,
      "-ss",
      "0",
      "-t",
      String(CLIP_DURATION_SECONDS),
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      outputPath,
    ],
    FFMPEG_TRIM_TIMEOUT_MS,
  );
}

/** Remux webm/opus (etc.) to m4a for reliable Web Audio playback in browsers. */
async function remuxToM4a(
  inputPath: string,
  outputPath: string,
): Promise<{ code: number; stderr: string }> {
  return runCommand(
    "ffmpeg",
    ["-y", "-i", inputPath, "-c:a", "aac", "-b:a", "128k", outputPath],
    FFMPEG_REMUX_TIMEOUT_MS,
  );
}

function isBrowserSafeClipExt(ext: string): boolean {
  const normalized = ext.toLowerCase();
  return normalized === ".m4a" || normalized === ".mp3";
}

async function ensureClipIsM4a(
  clipNumber: number,
  fileName: string,
): Promise<{ fileName: string | null; stderr: string }> {
  const ext = path.extname(fileName);
  if (isBrowserSafeClipExt(ext)) {
    return { fileName, stderr: "" };
  }

  const clipBase = clipNumberBase(clipNumber);
  const m4aFileName = `${clipBase}.m4a`;
  const inputPath = path.join(MEDIA_DIR, fileName);
  const outputPath = path.join(MEDIA_DIR, m4aFileName);

  const remux = await remuxToM4a(inputPath, outputPath);
  if (remux.code !== 0) {
    return { fileName: null, stderr: remux.stderr };
  }

  await fs.unlink(inputPath).catch(() => undefined);
  return { fileName: m4aFileName, stderr: "" };
}

async function markClipFailed(
  isrc: string,
  failReason: string,
  clipNumber?: number,
): Promise<void> {
  if (clipNumber !== undefined) {
    await removeFilesByPrefix(`${clipNumberBase(clipNumber)}.`);
  }

  await prisma.song.update({
    where: { isrc },
    data: { status: "failed", failReason },
  });
}

/**
 * Best-effort clip generation from t=0 using yt-dlp (partial native download)
 * with fallback to full download + ffmpeg trim.
 */
async function generateClip(track: EnsureTrackInput): Promise<void> {
  const sources = buildClipSources(track);
  if (sources.length === 0) {
    await markClipFailed(track.isrc, "MISSING_TITLE_ARTIST");
    return;
  }

  if (!(await toolsAvailable())) {
    await markClipFailed(track.isrc, "CLIP_TOOLS_UNAVAILABLE");
    return;
  }

  try {
    await fs.mkdir(MEDIA_DIR, { recursive: true });
  } catch {
    await markClipFailed(track.isrc, "MEDIA_DIR_UNAVAILABLE");
    return;
  }

  const clipNumber = await allocateClipNumber();
  const clipBase = clipNumberBase(clipNumber);
  const outputTemplate = path.join(MEDIA_DIR, `${clipBase}.%(ext)s`);

  let fileName: string | null = null;
  let lastStderr = "";

  for (let attempt = 0; attempt < CLIP_DOWNLOAD_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, CLIP_RETRY_DELAY_MS));
    }

    for (const source of sources) {
      await removeFilesByPrefix(`${clipBase}.`);
      const partial = await runCommand(
        "yt-dlp",
        ytdlpDownloadArgs({
          source,
          outputTemplate,
          durationMs: track.durationMs,
          partial: true,
        }),
        YTDLP_PARTIAL_TIMEOUT_MS,
      );
      lastStderr = partial.stderr;
      fileName = await findClipFileByNumber(clipNumber);
      if (ytdlpSucceeded(partial.code) && fileName) {
        break;
      }
      fileName = null;
    }

    if (fileName) break;
  }

  if (!fileName) {
    await removeFilesByPrefix(`${clipBase}.`);

    const tempStem = `tmp_${randomUUID()}`;
    const tempTemplate = path.join(MEDIA_DIR, `${tempStem}.%(ext)s`);
    const fullSource = sources[0] ?? "";
    const fullDownload = await runCommand(
      "yt-dlp",
      ytdlpDownloadArgs({
        source: fullSource,
        outputTemplate: tempTemplate,
        durationMs: track.durationMs,
        partial: false,
      }),
      YTDLP_FULL_TIMEOUT_MS,
    );

    const tempFileName = await findTempDownload(tempStem);
    if (!ytdlpSucceeded(fullDownload.code) || !tempFileName) {
      await removeFilesByPrefix(`${tempStem}.`);
      await markClipFailed(
        track.isrc,
        `YTDLP_FAILED:${(fullDownload.stderr || lastStderr).slice(0, 200)}`,
        clipNumber,
      );
      return;
    }

    const tempPath = path.join(MEDIA_DIR, tempFileName);
    fileName = `${clipBase}.m4a`;
    const clipPath = path.join(MEDIA_DIR, fileName);

    const trim = await trimWithFfmpeg(tempPath, clipPath);
    await fs.unlink(tempPath).catch(() => undefined);

    if (trim.code !== 0) {
      await fs.unlink(clipPath).catch(() => undefined);
      await markClipFailed(
        track.isrc,
        `FFMPEG_FAILED:${trim.stderr.slice(0, 200)}`,
        clipNumber,
      );
      return;
    }
  }

  const clipPath = path.join(MEDIA_DIR, fileName);
  try {
    const stat = await fs.stat(clipPath);
    if (stat.size <= 0) {
      await fs.unlink(clipPath).catch(() => undefined);
      await markClipFailed(track.isrc, "CLIP_EMPTY_FILE", clipNumber);
      return;
    }
  } catch {
    await markClipFailed(track.isrc, "CLIP_FILE_MISSING", clipNumber);
    return;
  }

  const normalized = await ensureClipIsM4a(clipNumber, fileName);
  if (!normalized.fileName) {
    await markClipFailed(
      track.isrc,
      `FFMPEG_REMUX_FAILED:${normalized.stderr.slice(0, 200)}`,
      clipNumber,
    );
    return;
  }
  fileName = normalized.fileName;

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

function drainClipQueue(): void {
  if (
    activeClipJobs === 0 &&
    clipQueue.length > 0 &&
    clipToolsAvailable === null
  ) {
    void toolsAvailable();
  }

  while (activeClipJobs < MAX_CONCURRENT_CLIPS && clipQueue.length > 0) {
    const track = clipQueue.shift();
    if (!track) return;

    activeClipJobs += 1;
    void generateClip(track)
      .catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error(String(err));
        logError({
          event: "clip_worker_failed",
          message: `Failed for ${track.isrc}`,
          errorName: error.name,
          errorMessage: error.message,
          stack: error.stack,
        });
      })
      .finally(() => {
        activeClipJobs -= 1;
        inFlight.delete(track.isrc);
        drainClipQueue();
      });
  }
}

function enqueueClip(track: EnsureTrackInput): void {
  if (inFlight.has(track.isrc)) return;
  inFlight.add(track.isrc);
  clipQueue.push(track);
  drainClipQueue();
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
        durationMs: track.durationMs,
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
          durationMs: track.durationMs,
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
