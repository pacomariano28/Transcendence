import process from "node:process";

/**
 * Prisma seed is a no-op. Default Mix audio is materialized at
 * runtime by defaultPlaylistBootstrap (Spotify metadata + clip worker).
 */
async function main() {
  console.log(
    "Playlist seed is a no-op; default library is bootstrapped by playlist-service.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
