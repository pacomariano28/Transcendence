import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/auth-context";
import { RequireAuth } from "./auth/RequireAuth";
import { ActiveMatchProvider } from "./context/active.match.context"; // 1. Imports the provider (adjust the route if necessary)
import AppHeader from "./components/AppHeader";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SpotifySuccessPage from "./pages/SpotifySuccessPage";
import RouteTransition from "./components/RouteTransition";
import ProfilePage from "./pages/ProfilePage";
import JoinRoomPage from "./pages/JoinRoomPage";
import RoomLobbyPage from "./pages/RoomLobbyPage";
import MatchPage from "./pages/MatchPage";
import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
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
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />

            <Route element={<RequireAuth />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/join" element={<JoinRoomPage />} />
              <Route path="/room/:code" element={<RoomLobbyPage />} />
              {/* Note: if your game route uses /match/ instead of /room/, make sure it matches the Header Link */}{" "}
              <Route path="/match/:code" element={<MatchPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
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
        {/* 2. We wrap AppShell so that AppHeader and all pages have access */}
        <ActiveMatchProvider>
          <AppShell />
        </ActiveMatchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
