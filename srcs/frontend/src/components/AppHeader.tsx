import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../api/auth";
import { useAuth } from "../auth/auth-context";
import { useActiveMatch } from "../context/active.match.context";
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
  const { pathname } = useLocation();
  const { user, loading, clear } = useAuth();
  const { activeMatch } = useActiveMatch();

  async function onLogout() {
    try {
      await logout();
    } finally {
      clear();
      nav("/login", { replace: true });
    }
  }

  const avatarUrl = user?.spotifyProfile?.avatarUrl ?? null;

  // 👁️ Solo se muestra si hay partida activa Y NO estamos dentro de una pantalla de partida (/match/...)
  const showLiveBar = activeMatch && !pathname.startsWith("/match");

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/60 backdrop-blur">
      {/* 1. Contenedor del contenido principal (Logo, Nav, Usuario) */}
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

      {/* 2. 🟢 BARRA DE LIVE COMPLETA Y CLICKABLE (Oculta automáticamente en la pantalla de juego) */}
      {showLiveBar && (
        <Link
          to={`/match/${activeMatch.code}`}
          className="w-full bg-emerald-600 text-zinc-950 font-mono text-[10px] sm:text-xs font-black tracking-widest py-1.5 px-4 flex items-center justify-center gap-50 border-t border-emerald-400/20 shadow-[0_4px_20px_rgba(16,185,129,0.2)] transition-all duration-200 hover:bg-emerald-500 cursor-pointer select-none animate-fade-in"
        >
          {/* Lado izquierdo: Indicador de En Vivo */}
          <div className="flex items-center gap-2">
            {/* Ajuste óptico: -translate-y-[1px] eleva la bolita exactamente al centro visual de las mayúsculas */}
            <span className="relative flex h-2 w-2 -translate-y-[1px]">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-600 opacity-60"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600"></span>
            </span>
            {/* leading-none quita los márgenes invisibles de la tipografía por arriba y abajo */}
            <span className="leading-none">LIVE MATCH IN PROGRESS</span>
          </div>

          {/* Lado derecho: Datos de la sala y ronda */}
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="opacity-90">ROOM: {activeMatch.code}</span>
            {activeMatch.roundLabel && (
              /* Cambiamos inline-flex por inline-block y controlamos el padding píxel a píxel */
              <span
                className="inline-block bg-zinc-950 text-emerald-400 px-1.5 rounded-md text-[9px] sm:text-xs font-bold tracking-wide shadow-sm font-mono text-center
      pt-[2px] pb-[3px]
      sm:pt-[3px] sm:pb-[3px]"
              >
                {activeMatch.roundLabel}
              </span>
            )}
          </div>
        </Link>
      )}
    </header>
  );
}
