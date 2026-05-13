import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="container-page py-12 fade-in">
      <div className="mx-auto max-w-3xl">
        <div className="card p-8">
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Guess the song.
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Minimal multiplayer shell. Auth is live, rooms are next.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/create" className="btn-primary flex-1">
              Create room
            </Link>
            <Link to="/join" className="btn-ghost flex-1">
              Join room
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
            {loading ? (
              <span className="text-zinc-400 animate-pulse">
                Checking session…
              </span>
            ) : user ? (
              <span>
                You’re signed in as{" "}
                <span className="text-zinc-100">
                  {user.username ?? user.email}
                </span>
                . Go to{" "}
                <Link className="link" to="/profile">
                  Profile
                </Link>
                .
              </span>
            ) : (
              <span>
                You’re not signed in.{" "}
                <Link className="link" to="/login">
                  Login
                </Link>{" "}
                to keep your session across refreshes.
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="card card-hover p-5 fade-in">
            <div className="text-xs font-medium text-zinc-400">Status</div>
            <div className="mt-2 text-sm text-zinc-200">
              Auth + UI foundation ready.
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              Next: lobby + room code flow.
            </div>
          </div>

          <div className="card card-hover p-5 fade-in">
            <div className="text-xs font-medium text-zinc-400">Controls</div>
            <div className="mt-2 text-sm text-zinc-200">
              Short transitions, low noise.
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              Built with Tailwind v4.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
