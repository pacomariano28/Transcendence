import { Link, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { useAuth } from "../auth/auth-context";
import { useActiveMatch } from "../context/active.match.context"; // Importamos el nuevo contexto
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

function UserAvatar({
  username,
  email,
  imageUrl,
}: {
  username?: string | null;
  email?: string | null;
  imageUrl?: string | null;
}) {
  const initials =
    (username?.[0] ?? email?.[0] ?? "U").toUpperCase() +
    ((username?.[1] ?? email?.[1] ?? "") || "").toUpperCase();

  return (
    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 ring-1 ring-white/10 transition-all duration-200 hover:ring-[#f7d046]/40">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={username ?? email ?? "User avatar"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-sm font-semibold text-zinc-200">{initials}</span>
      )}
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M10 17l1.5-1.5L8 12h9v-2H8l3.5-3.5L10 5l-6 7 6 7z"
        fill="currentColor"
      />
      <path d="M20 5h-2v14h2V5z" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

export default function AppHeader() {
  const nav = useNavigate();
  const { user, loading, clear } = useAuth();
  const { activeMatch } = useActiveMatch(); // Consumimos el estado de la partida activa

  async function onLogout() {
    try {
      await logout();
    } finally {
      clear();
      nav("/login", { replace: true });
    }
  }

  const avatarUrl = user?.spotifyProfile?.avatarUrl ?? null;

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/60 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="rounded-xl px-3 py-2 text-sm font-semibold tracking-wide text-white/90 transition duration-150 hover:bg-white/10 hover:text-white"
          >
            Songuess
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <NavItem to="/" label="Home" />
            <NavItem to="/profile" label="Profile" />
            <NavItem to="/dashboard" label="Dashboard" />
          </nav>
        </div>

        {/* --- VENTANA / BADGE DE LA PARTIDA EN SEGUNDO PLANO --- */}
        {activeMatch && (
          <div className="animate-fade-in mx-2 hidden sm:block">
            <Link
              to={`/match/${activeMatch.code}`}
              // Añadidas clases de hover:scale, hover:shadow y transiciones mejoradas
              className="group flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 font-mono text-xs font-bold tracking-wider text-emerald-400 transition-all duration-300 hover:scale-[1.02] hover:border-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>

              <span className="block group-hover:hidden">
                LIVE: {activeMatch.code}{" "}
                {activeMatch.roundLabel ? `(${activeMatch.roundLabel})` : ""}
              </span>

              {/* Animación de la flecha deslizante al hacer hover */}
              <span className="hidden group-hover:block text-emerald-300 animate-fade-in">
                Return to Match{" "}
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                  &rarr;
                </span>
              </span>
            </Link>
          </div>
        )}

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="animate-pulse text-sm text-zinc-400">
              Checking session…
            </div>
          ) : user ? (
            <>
              <div className="hidden items-center gap-3 md:flex fade-in">
                <UserAvatar
                  username={user.username}
                  email={user.email}
                  imageUrl={avatarUrl}
                />
                <div className="text-sm text-zinc-300">
                  <span className="block text-zinc-400">Signed in as</span>
                  <span className="text-zinc-200">
                    {user.username ?? user.email}
                  </span>
                </div>
              </div>

              <div className="md:hidden">
                <UserAvatar
                  username={user.username}
                  email={user.email}
                  imageUrl={avatarUrl}
                />
              </div>

              <button
                className="btn-glow btn-glow-no-bold px-4"
                style={{ "--btn-color": "#d12219" } as React.CSSProperties}
                onMouseMove={handleMouseMoveToSetFillOrigin}
                type="button"
                onClick={onLogout}
                aria-label="Logout"
                title="Logout"
              >
                <LogoutIcon />
              </button>
            </>
          ) : (
            <Link to="/login">
              <button
                className="btn-glow btn-glow-no-bold w-full"
                style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
                onMouseMove={handleMouseMoveToSetFillOrigin}
                type="button"
              >
                <span>Login</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Badge responsivo para móviles debajo de la barra si la pantalla es muy pequeña */}
      {activeMatch && (
        <div className="sm:hidden border-t border-emerald-500/10 bg-emerald-950/40 px-4 py-1.5 text-center">
          <Link
            to={`/match/${activeMatch.code}`}
            className="inline-flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-emerald-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Partida activa ({activeMatch.code}) &rarr;
          </Link>
        </div>
      )}
    </header>
  );
}
