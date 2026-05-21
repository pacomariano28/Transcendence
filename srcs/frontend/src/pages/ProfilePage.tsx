import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import TypingText from "../components/TypingText";

type SpotifyArtist = {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  imageUrl: string | null;
};

type SpotifyTrack = {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
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
  topTrackMonth: SpotifyTrack[];
  topTrackAllTime: SpotifyTrack[];
  syncedAt: string;
  avatarUrl?: string | null;
};

type AuthUser = {
  id: string;
  email: string;
  username: string;
  spotifyProfile?: SpotifyProfile | null;
};

function ProfileAvatar({
  username,
  email,
  imageUrl,
}: {
  username?: string | null;
  email?: string | null;
  imageUrl?: string | null;
}) {
  const [tilt, setTilt] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTilt(true);
      window.setTimeout(() => setTilt(false), 420);
    }, 6500);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const initials =
    (username?.[0] ?? email?.[0] ?? "U").toUpperCase() +
    ((username?.[1] ?? email?.[1] ?? "") || "").toUpperCase();

  return (
    <div
      className={[
        "flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 ring-1 ring-white/10 transition-all duration-500",
        "hover:scale-105 hover:ring-[#f7d046]/40 hover:shadow-[0_0_0_1px_rgba(247,208,70,0.12),0_10px_24px_rgba(0,0,0,0.18)]",
        tilt ? "rotate-6 scale-[1.03]" : "rotate-0",
      ].join(" ")}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={username ?? email ?? "User avatar"}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
        />
      ) : (
        <span className="text-sm font-semibold text-zinc-200">{initials}</span>
      )}
    </div>
  );
}

function TrackCard({
  title,
  subtitle,
  track,
}: {
  title: string;
  subtitle: string;
  track?: SpotifyTrack | null;
}) {
  if (!track) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f7d046]/40 hover:bg-white/5 hover:shadow-[0_0_0_1px_rgba(247,208,70,0.08),0_12px_30px_rgba(0,0,0,0.18)]">
        <div className="text-xs font-medium text-zinc-400">{title}</div>
        <div className="mt-4 text-sm text-zinc-500">No track available.</div>
      </div>
    );
  }

  return (
    <div className="group rounded-3xl border border-white/10 bg-black/20 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f7d046]/50 hover:bg-white/5 hover:shadow-[0_0_0_1px_rgba(247,208,70,0.12),0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-zinc-400">{title}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            {subtitle}
          </div>
        </div>

        <div className="rounded-full border border-[#f7d046]/20 bg-[#f7d046]/10 px-2.5 py-1 text-[11px] font-medium text-[#f7d046] transition-colors duration-200 group-hover:border-[#f7d046]/40 group-hover:bg-[#f7d046]/15">
          Popularity {track.popularity}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 transition-all duration-200 group-hover:scale-[1.03] group-hover:ring-[#f7d046]/40">
          {track.imageUrl ? (
            <img
              src={track.imageUrl}
              alt={track.name}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="text-xs text-zinc-400">No img</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold text-white transition-colors duration-200 group-hover:text-[#fff3bf]">
            {track.name}
          </div>
          <div className="mt-1 truncate text-sm text-zinc-400">
            {track.artists.map((artist) => artist.name).join(", ")}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "neutral",
  children,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "gold" | "green";
  children?: React.ReactNode;
}) {
  const toneClasses =
    tone === "gold"
      ? "border-[#f7d046]/20 bg-[#f7d046]/10"
      : tone === "green"
        ? "border-emerald-400/20 bg-emerald-400/10"
        : "border-white/10 bg-black/20";

  return (
    <div
      className={`rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f7d046]/50 hover:bg-white/5 hover:shadow-[0_0_0_1px_rgba(247,208,70,0.12),0_18px_40px_rgba(0,0,0,0.18)] ${toneClasses}`}
    >
      <div className="text-xs font-medium text-zinc-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white transition-transform duration-200 hover:translate-x-0.5">
        {value}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth() as { user: AuthUser | null };

  const spotifyProfile = user?.spotifyProfile ?? null;
  const topGenre = spotifyProfile?.topGenres?.[0] ?? null;
  const hasSpotify = !!spotifyProfile;

  const monthTrack = spotifyProfile?.topTrackMonth?.[0] ?? null;
  const allTimeTrack = spotifyProfile?.topTrackAllTime?.[0] ?? null;

  return (
    <div className="container-page py-10 fade-in">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <TypingText text="PROFILE" size="lg" />
            <p className="mt-2 text-sm text-zinc-400">
              Session data from /api/auth/me
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300 transition-all duration-200 hover:border-[#f7d046]/40 hover:bg-white/5">
            Protected
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <StatCard label="User email" value={user?.email ?? "-"}>
            <div className="text-xs text-zinc-500">Username</div>
            <div className="text-sm text-zinc-200">{user?.username ?? "-"}</div>
          </StatCard>

          <StatCard
            label="Top Genre"
            value={topGenre?.name ?? "-"}
            tone="green"
          >
            {topGenre ? (
              <div className="text-xs text-emerald-200/80">
                Weight: {topGenre.weight.toFixed(2)}
              </div>
            ) : (
              <div className="text-xs text-zinc-500">No genre data</div>
            )}
          </StatCard>
        </div>

        {hasSpotify ? (
          <>
            <div className="mt-8">
              <div className="mb-3 text-sm font-medium text-zinc-300">
                Top Tracks
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <TrackCard
                  title="Song of the month"
                  subtitle="Recent listening"
                  track={monthTrack}
                />
                <TrackCard
                  title="Song of all time"
                  subtitle="All time listening"
                  track={allTimeTrack}
                />
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-3 text-sm font-medium text-zinc-300">
                Top Artists
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {spotifyProfile?.topArtists?.length ? (
                  spotifyProfile.topArtists.map((artist, index) => (
                    <div
                      key={artist.id}
                      className="group rounded-3xl border border-white/10 bg-black/20 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f7d046]/50 hover:bg-white/5 hover:shadow-[0_0_0_1px_rgba(247,208,70,0.12),0_18px_40px_rgba(0,0,0,0.2)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="transition-transform duration-200 group-hover:rotate-[-2deg]">
                          <ProfileAvatar
                            username={artist.name}
                            email={undefined}
                            imageUrl={artist.imageUrl}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-zinc-500">
                            Rank #{index + 1}
                          </div>
                          <div className="truncate text-base font-semibold text-white transition-colors duration-200 group-hover:text-[#fff3bf]">
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
                              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f7d046]/30 hover:bg-[#f7d046]/10 hover:text-zinc-100"
                            >
                              {genre}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-zinc-500">
                            No genres
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-400">No artists yet.</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#f7d046]/30 bg-black/20 p-6 text-center mt-4">
            <div className="text-lg font-semibold text-white">
              Spotify not connected
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Log in with your Spotify account to unlock your top artists,
              genres and music profile.
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
  );
}
