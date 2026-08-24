import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";

const TEAM = [
  { name: "frmarian", href: "https://github.com/pacomariano28" },
  { name: "smoore-a", href: "https://github.com/seilanmoore" },
  { name: "jortiz-m", href: "https://github.com/jortiz-m/jortiz-m" },
  { name: "stitovsk", href: "https://github.com/svetameanssun" },
  { name: "rjaada", href: "https://github.com/rjaada" },
];

const WAVE = [8, 15, 22, 12, 29, 18, 35, 21, 13, 27, 39, 17, 25, 11, 31];

export default function CompactLandingPage() {
  const { user } = useAuth();
  const destination = user ? "/play" : "/login";

  return (
    <div className="compact-landing">
      <div className="compact-ambient" aria-hidden="true" />

      <header className="compact-nav">
        <Link className="compact-wordmark" to="/">
          <span className="compact-logo" aria-hidden="true">
            <i />
          </span>
          <span>Songuess</span>
        </Link>

        <Link
          className="btn-glow compact-nav-action"
          style={{ "--btn-color": "#f7d046" } as CSSProperties}
          onMouseMove={handleMouseMoveToSetFillOrigin}
          to={destination}
        >
          <span>{user ? "Enter the game" : "Log in"}</span>
        </Link>
      </header>

      <main className="compact-main">
        <section className="compact-copy" aria-labelledby="compact-title">
          <p className="compact-kicker">
            <span aria-hidden="true" /> Real-time music trivia · 2–5 players
          </p>
          <h1 id="compact-title">
            Stop the music.
            <strong>Name the track.</strong>
          </h1>
          <p className="compact-intro">
            Everyone hears the same preview. Buzz in first, make your guess, and
            outscore the room.
          </p>

          <div className="compact-actions">
            <Link
              className="btn-glow compact-primary-action"
              style={{ "--btn-color": "#f7d046" } as CSSProperties}
              onMouseMove={handleMouseMoveToSetFillOrigin}
              to={destination}
            >
              <span>{user ? "Play Songuess" : "Log in to play"}</span>
              <span aria-hidden="true">→</span>
            </Link>
            <p>No download. One room code gets everyone in.</p>
          </div>
        </section>

        <section className="compact-player" aria-label="Songuess game preview">
          <div className="compact-player-head">
            <span>
              <i /> Room ready
            </span>
            <span>Round 01 / 05</span>
          </div>

          <div className="compact-disc-stage">
            <div className="compact-disc" aria-hidden="true">
              <span className="compact-disc-grooves" />
              <span className="compact-disc-label">
                <small>Preview</small>
                <strong>0:15</strong>
              </span>
            </div>
            <div className="compact-buzz-card">
              <span>First to</span>
              <strong>BUZZ</strong>
            </div>
          </div>

          <div className="compact-now-playing">
            <div>
              <span>Now playing</span>
              <strong>Everybody hears it at once</strong>
            </div>
            <div className="compact-wave" aria-hidden="true">
              {WAVE.map((height, index) => (
                <i key={`${height}-${index}`} style={{ height }} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="compact-team">
        <p>Built at 42 by</p>
        <div>
          {TEAM.map((member) => (
            <a
              href={member.href}
              key={member.name}
              rel="noreferrer"
              target="_blank"
            >
              {member.name}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
