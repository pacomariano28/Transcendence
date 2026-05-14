import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";
import TypingText from "../components/TypingText";

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="container-page py-8 sm:py-10 lg:py-12 fade-in">
      <div className="mx-auto max-w-4xl">
        <div className="page-card">
          <div className="section-stack">
            <div>
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1 mb-2">
                <h1 className="page-title mb-4">Guess the song.</h1>

                <div className="pb-1 font-mono text-xs sm:text-sm tracking-[0.35em] text-[#f7d046] mb-3">
                  <TypingText
                    text="SONGUESS"
                    className="drop-shadow-[0_0_14px_rgba(247,208,70,0.16)]"
                    typingDelays={[220, 300, 180, 260, 200, 340, 170, 280]}
                    typoChance={0.22}
                    pauseAfterCompleteMs={2200}
                    pauseAfterDeleteMs={700}
                    cursorBlinkMs={550}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/create"
                className="btn-glow w-full sm:flex-1"
                style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
                onMouseMove={handleMouseMoveToSetFillOrigin}
              >
                <span>Create room</span>
              </Link>

              <Link to="/join" className="btn-ghost w-full sm:flex-1">
                Join room
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
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
