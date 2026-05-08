import "./App.css";

import { HealthCheckButton } from "./HealthCheckButton";
import { MatchLobby } from "./MatchLobby";
import { RegisterForm } from "./RegisterForm";
import SearchBar from "./SearchTrackBar";

function App() {
  return (
    <main className="app-shell">
      <section className="match-hero">
        <div className="match-copy">
          <p className="eyebrow">Songuess dev console</p>
          <h1>Start or join a match</h1>
          <p className="lede">
            Connect to the game-service, create a room, and invite a second
            player with the room id.
          </p>
          {/* <div className="support-stack">
            <HealthCheckButton />
            <SearchBar />
            <RegisterForm />
          </div> */}
        </div>

        <MatchLobby />
      </section>
    </main>
  );
}

export default App;
