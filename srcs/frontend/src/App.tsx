import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/auth-context";
import { RequireAuth } from "./auth/RequireAuth";
import { ActiveMatchProvider } from "./context/active.match.context"; // 1. Importa el proveedor (ajusta la ruta si es necesario)
import AppHeader from "./components/AppHeader";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SpotifySuccessPage from "./pages/SpotifySuccessPage";
import DashboardPage from "./pages/DashboardPage";
import RouteTransition from "./components/RouteTransition";
import ProfilePage from "./pages/ProfilePage";
import JoinRoomPage from "./pages/JoinRoomPage";
import RoomLobbyPage from "./pages/RoomLobbyPage";
import MatchPage from "./pages/MatchPage";
import Footer from "./components/AppFooter";

function AppShell() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-zinc-400">
        Checking session...
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-bg" />
      <AppHeader />

      <main className="flex-1">
        <RouteTransition>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/auth/spotify/success"
              element={<SpotifySuccessPage />}
            />

            <Route element={<RequireAuth />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/join" element={<JoinRoomPage />} />
              <Route path="/room/:code" element={<RoomLobbyPage />} />
              {/* Nota: si tu ruta de juego usa /match/ en vez de /room/, asegúrate de que coincida con el Link del Header */}
              <Route path="/match/:code" element={<MatchPage />} />
            </Route>
          </Routes>
        </RouteTransition>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* 2. Envolvemos AppShell para que AppHeader y todas las páginas tengan acceso */}
        <ActiveMatchProvider>
          <AppShell />
        </ActiveMatchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
