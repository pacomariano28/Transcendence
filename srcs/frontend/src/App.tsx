<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import CreateRoomPage from "./pages/CreateRoomPage";
import RoomLobbyPage from "./pages/RoomLobbyPage";
import MatchPage from "./pages/MatchPage";
import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import Footer from "./components/AppFooter";
import SetupGuideModal, { useSetupGuide } from "./components/SetupGuideModal";
import { usePreventSpaceScroll } from "./hooks/usePreventSpaceScroll";

function AppShell() {
  const { loading } = useAuth();
  const setupGuide = useSetupGuide();
  usePreventSpaceScroll();

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
=======
import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";

import { HealthCheckButton } from "./HealthCheckButton";
import { RegisterForm } from "./RegisterForm";
import SearchBar from "./SearchTrackBar";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <div className="App">
            <h1>Songuess Dev Testing</h1>
            <HealthCheckButton />
            <SearchBar />
            <RegisterForm />
          </div>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>
>>>>>>> main

      <main className="flex-1">
        <RouteTransition>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/play" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/auth/spotify/success"
              element={<SpotifySuccessPage />}
            />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />

            <Route element={<RequireAuth />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/create" element={<CreateRoomPage />} />
              <Route path="/join" element={<JoinRoomPage />} />
              <Route path="/room/:code" element={<RoomLobbyPage />} />
              {/* Note: if your game route uses /match/ instead of /room/, make sure it matches the Header Link */}{" "}
              <Route path="/match/:code" element={<MatchPage />} />
            </Route>

<<<<<<< HEAD
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </RouteTransition>
      </main>

      <Footer />

      {setupGuide.visible ? (
        <SetupGuideModal
          status={setupGuide.status}
          hostChanged={setupGuide.hostChanged}
          onDismiss={setupGuide.dismiss}
        />
      ) : null}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ActiveMatchProvider>
          <AppShell />
        </ActiveMatchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
=======
      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  );
}

export default App;
>>>>>>> main
