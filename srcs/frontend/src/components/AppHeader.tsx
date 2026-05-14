import { Link, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";

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
  const nav = useNavigate();
  const { user, loading, reload } = useAuth();

  async function onLogout() {
    try {
      await logout();
    } finally {
      await reload();
      nav("/login", { replace: true });
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/60 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="rounded-xl px-3 py-2 text-sm font-semibold tracking-wide text-white/90
                       transition duration-150 hover:bg-white/10 hover:text-white"
          >
            Songuess
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <NavItem to="/" label="Home" />
            <NavItem to="/profile" label="Profile" />
            <NavItem to="/dashboard" label="Dashboard" />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="text-sm text-zinc-400 animate-pulse">
              Checking session…
            </div>
          ) : user ? (
            <>
              <div className="hidden text-sm text-zinc-300 md:block fade-in">
                <span className="text-zinc-400">Signed in as </span>
                <span className="text-zinc-200">
                  {user.username ?? user.email}
                </span>
              </div>
              <button
                className="btn-logout"
                onMouseMove={handleMouseMoveToSetFillOrigin}
                type="button"
                onClick={onLogout}
              >
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login">
              <button
                className="btn-glow btn-glow-no-bold w-full"
                style={
                  {
                    "--btn-color": "#f7d046",
                    "--font-weight": "none",
                  } as React.CSSProperties
                }
                onMouseMove={handleMouseMoveToSetFillOrigin}
              >
                <span>Login</span>
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
