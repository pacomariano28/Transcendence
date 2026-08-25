import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { logout } from "../api/auth";
import { useAuth } from "../auth/auth-context";
import { useActiveMatch } from "../context/active.match.context";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";
import { socket } from "../api/socket";
import UserAvatarMenu from "./UserAvatarMenu";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "rounded-xl px-3 py-2 text-sm font-medium transition duration-150",
          "hover:bg-white/10 hover:text-white",
          isActive ? "bg-white/10 text-white" : "text-zinc-300",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export default function AppHeader() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { user, loading, clear } = useAuth();
  const { activeMatch, setActiveMatch } = useActiveMatch();

  async function onLogout() {
    try {
      await logout();
    } finally {
      clear();
      nav("/login", { replace: true });
    }
  }

  function leaveMatch(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (socket.connected) {
      socket.emit("match:leave");
    }
    setActiveMatch(null);
  }

  const avatarUrl = user?.spotifyProfile?.avatarUrl ?? null;

  // Hide while in lobby; the live bar is only useful during an active match screen.
  const showLiveBar =
    activeMatch &&
    !pathname.startsWith("/match") &&
    !pathname.startsWith("/room");

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/60 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/play"
            className="rounded-xl px-3 py-2 text-sm font-semibold tracking-wide text-white/90 transition duration-150 hover:bg-white/10 hover:text-white"
          >
            Songuess
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <NavItem to="/play" label={t("header.nav_home")} />
            <NavItem to="/profile" label={t("header.nav_profile")} />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="animate-pulse text-sm text-zinc-400">
              {t("home.checking_session")}
            </div>
          ) : user ? (
            <UserAvatarMenu
              username={user.username}
              email={user.email}
              imageUrl={avatarUrl}
              displayName={user.username ?? user.email}
              onLogout={onLogout}
            />
          ) : (
            <Link to="/login">
              <button
                className="btn-glow btn-glow-no-bold w-full"
                style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
                onMouseMove={handleMouseMoveToSetFillOrigin}
                type="button"
              >
                <span>{t("auth.login")}</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {showLiveBar && user && (
        <Link
          to={`/match/${activeMatch.code}`}
          className="w-full bg-emerald-600 text-zinc-950 font-mono text-[10px] sm:text-xs font-black tracking-widest py-1.5 border-t border-emerald-400/20 shadow-[0_4px_20px_rgba(16,185,129,0.2)] transition-all duration-200 hover:bg-emerald-500 cursor-pointer animate-fade-in block"
        >
          <div className="container-page">
            <div className="mx-auto max-w-4xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2 -translate-y-[1px]">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-600 opacity-60"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600"></span>
                </span>
                <span className="leading-none">
                  {t("header.live_match_in_progress")}
                </span>
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                <span className="select-text opacity-90">
                  {t("header.room")} {activeMatch.code}
                </span>
                {activeMatch.roundLabel && (
                  <span
                    className="inline-block bg-zinc-950 text-emerald-400 px-1.5 rounded-md text-[9px] sm:text-xs font-bold tracking-wide shadow-sm font-mono text-center
      pt-[2px] pb-[3px]
      sm:pt-[3px] sm:pb-[3px]"
                  >
                    {activeMatch.roundLabel}
                  </span>
                )}
                <div className="group relative flex items-center">
                  <button
                    type="button"
                    onClick={leaveMatch}
                    aria-label={t("lobby.leaveRoom")}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-white transition-colors duration-150 hover:bg-zinc-950/20"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      className="h-3.5 w-3.5"
                    >
                      <line x1="4" y1="4" x2="20" y2="20" />
                      <line x1="20" y1="4" x2="4" y2="20" />
                    </svg>
                  </button>
                  <span className="pointer-events-none absolute -top-8 right-[-12px] whitespace-nowrap rounded-md bg-zinc-950 px-2 py-1 font-mono text-[9px] sm:text-[10px] font-black tracking-widest text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
                    {t("lobby.leaveRoom")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}
    </header>
  );
}
