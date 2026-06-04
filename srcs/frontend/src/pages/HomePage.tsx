import { Link } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";
import TypingText from "../components/TypingText";
import LinkIcon from "../components/icons/LinkIcon";

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="container-page py-8 sm:py-10 lg:py-12 fade-in">
      <div className="mx-auto max-w-4xl flex flex-col gap-14">
        <div className="page-card">
          <div className="section-stack">
            <div className="space-y-3">
              <h1 className="page-title">Guess the song.</h1>

              <TypingText text="SONGUESS" size="md" className="ms-1" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row mt-10">
              <Link
                to="/create"
                className="btn-glow w-full sm:flex-1 p-10"
                style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
                onMouseMove={handleMouseMoveToSetFillOrigin}
              >
                <span>Create room</span>
              </Link>

              <Link
                to="/join"
                className="btn-glow w-full sm:flex-1 p-10"
                style={{ "--btn-color": "#ede9db" } as React.CSSProperties}
                onMouseMove={handleMouseMoveToSetFillOrigin}
              >
                <span>Join room</span>
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 transition-colors duration-200 hover:border-white/15 hover:bg-white/5">
              {loading ? (
                <span className="animate-pulse text-zinc-400">
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
        </div>

        <div className="flex flex-col gap-4">
          <TypingText text="MADE BY" size="md" className="ms-1" />
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <a
              href="https://github.com/pacomariano28"
              target="blank"
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 transition-colors duration-200 hover:border-white/15 hover:bg-white/5 group"
            >
              <span>frmarian</span>
              <span className="transform transition-transform duration-200 ease-out group-hover:scale-125 motion-reduce:transform-none">
                <LinkIcon />
              </span>
            </a>

            <a
              href="https://github.com/seilanmoore"
              target="blank"
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 transition-colors duration-200 hover:border-white/15 hover:bg-white/5 group"
            >
              <span>smoore-a</span>
              <span className="transform transition-transform duration-200 ease-out group-hover:scale-125 motion-reduce:transform-none">
                <LinkIcon />
              </span>
            </a>

            <a
              href="https://github.com/jortiz-m/jortiz-m"
              target="blank"
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 transition-colors duration-200 hover:border-white/15 hover:bg-white/5 group"
            >
              <span>jortiz-m</span>
              <span className="transform transition-transform duration-200 ease-out group-hover:scale-125 motion-reduce:transform-none">
                <LinkIcon />
              </span>
            </a>

            <a
              href="https://github.com/svetameanssun"
              target="blank"
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 transition-colors duration-200 hover:border-white/15 hover:bg-white/5 group"
            >
              <span>stitovsk</span>
              <span className="transform transition-transform duration-200 ease-out group-hover:scale-125 motion-reduce:transform-none">
                <LinkIcon />
              </span>
            </a>
          </div>
        </div>

        {/* <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="card card-hover p-5 fade-in">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Status
            </div>
            <div className="mt-2 text-sm text-zinc-200">
              Auth + UI foundation ready.
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              Next: lobby + room code flow.
            </div>
          </div>

          <div className="card card-hover p-5 fade-in">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Controls
            </div>
            <div className="mt-2 text-sm text-zinc-200">
              Short transitions, low noise.
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              Built with Tailwind v4.
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
