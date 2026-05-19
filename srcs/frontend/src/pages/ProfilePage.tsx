import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type SpotifyArtist = {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  imageUrl: string | null;
};

type SpotifyGenre = {
  name: string;
  weight: number;
};

type SpotifyProfile = {
  spotifyUserId: string;
  displayName: string | null;
  email: string | null;
  topArtists: SpotifyArtist[];
  topGenres: SpotifyGenre[];
  syncedAt: string;
};

type AuthUser = {
  id: string;
  email: string;
  username: string;
  spotifyProfile?: SpotifyProfile | null;
};

export default function ProfilePage() {
  const { user } = useAuth() as { user: AuthUser | null };

  const spotifyProfile = user?.spotifyProfile ?? null;
  const topGenre = spotifyProfile?.topGenres?.[0] ?? null;
  const hasSpotify = !!spotifyProfile;

  return (
    <div className="container-page py-10 fade-in">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Profile
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Session data from /api/auth/me
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300">
            Protected
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-all duration-200 hover:border-[#f7d046]/50 hover:bg-white/5 hover:shadow-[0_0_0_1px_rgba(247,208,70,0.12),0_10px_30px_rgba(0,0,0,0.18)]">
            <div className="text-xs font-medium text-zinc-400">User</div>
            <div className="mt-3 space-y-2 text-sm text-zinc-200">
              <div>
                <div className="text-xs text-zinc-500">Email</div>
                <div>{user?.email ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Username</div>
                <div>{user?.username ?? "-"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-all duration-200 hover:border-[#f7d046]/50 hover:bg-white/5 hover:shadow-[0_0_0_1px_rgba(247,208,70,0.12),0_10px_30px_rgba(0,0,0,0.18)]">
            <div className="text-xs font-medium text-zinc-400">
              Spotify Profile
            </div>

            {hasSpotify ? (
              <div className="mt-3 space-y-2 text-sm text-zinc-200">
                <div>
                  <div className="text-xs text-zinc-500">Display Name</div>
                  <div>{spotifyProfile?.displayName ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Synced At</div>
                  <div>
                    {spotifyProfile?.syncedAt
                      ? new Date(spotifyProfile.syncedAt).toLocaleString()
                      : "-"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-[#f7d046]/30 bg-[#f7d046]/10 p-4">
                <div className="text-sm font-medium text-[#f7d046]">
                  Spotify not connected
                </div>
                <p className="mt-2 text-sm text-zinc-300">
                  To unlock your top artists, genres and music profile, you need
                  to sign in with Spotify.
                </p>
                <Link
                  to="/login"
                  className="mt-4 inline-flex rounded-xl border border-[#f7d046]/30 bg-[#f7d046]/10 px-3 py-2 text-sm font-medium text-[#f7d046] transition-colors hover:bg-[#f7d046]/15"
                >
                  Connect Spotify
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 transition-all duration-200 hover:border-[#f7d046]/50 hover:bg-white/5 hover:shadow-[0_0_0_1px_rgba(247,208,70,0.12),0_10px_30px_rgba(0,0,0,0.18)]">
            <div className="text-xs font-medium text-emerald-300">
              Top Genre
            </div>
            <div className="mt-3">
              <div className="text-2xl font-semibold text-white">
                {topGenre?.name ?? "-"}
              </div>
              {topGenre && (
                <div className="mt-1 text-xs text-emerald-200/80">
                  Weight: {topGenre.weight.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 text-sm font-medium text-zinc-300">
            Top Artists
          </div>

          {hasSpotify ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {spotifyProfile?.topArtists?.length ? (
                spotifyProfile.topArtists.map((artist, index) => (
                  <div
                    key={artist.id}
                    className="group rounded-2xl border border-white/10 bg-black/20 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f7d046]/50 hover:bg-white/5 hover:shadow-[0_0_0_1px_rgba(247,208,70,0.12),0_10px_30px_rgba(0,0,0,0.2)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 transition-all duration-200 group-hover:ring-[#f7d046]/40">
                        {artist.imageUrl ? (
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-xs text-zinc-400">No img</div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-zinc-500">
                          Rank #{index + 1}
                        </div>
                        <div className="truncate text-base font-semibold text-white">
                          {artist.name}
                        </div>
                        <div className="text-xs text-zinc-400">
                          Popularity {artist.popularity}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {artist.genres?.length ? (
                        artist.genres.map((genre) => (
                          <span
                            key={genre}
                            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300 transition-colors duration-200 group-hover:border-[#f7d046]/30 group-hover:bg-[#f7d046]/10 group-hover:text-zinc-100"
                          >
                            {genre}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-500">No genres</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-400">No artists yet.</div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#f7d046]/30 bg-black/20 p-6 text-center">
              <div className="text-lg font-semibold text-white">
                Spotify not connected
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Create your account with Spotify login to unlock your top
                artists, genres and music profile.
              </p>
              <Link
                to="/login"
                className="mt-4 inline-flex rounded-xl border border-[#f7d046]/30 bg-[#f7d046]/10 px-4 py-2 text-sm font-medium text-[#f7d046] transition-colors hover:bg-[#f7d046]/15"
              >
                Connect Spotify
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
