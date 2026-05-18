import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import AppHeader from "./components/AppHeader";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SpotifySuccessPage from "./pages/SpotifySuccessPage";
import DashboardPage from "./pages/DashboardPage";
import RouteTransition from "./components/RouteTransition";
import ProfilePage from "./pages/ProfilePage";
import CreateRoomPage from "./pages/CreateRoomPage";
import JoinRoomPage from "./pages/JoinRoomPage";
import RoomLobbyPage from "./pages/RoomLobbyPage";
import Footer from "./components/AppFooter";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
                <Route path="/create" element={<CreateRoomPage />} />
                <Route path="/join" element={<JoinRoomPage />} />

                <Route element={<RequireAuth />}>
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/room/:code" element={<RoomLobbyPage />} />
                </Route>
              </Routes>
            </RouteTransition>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
