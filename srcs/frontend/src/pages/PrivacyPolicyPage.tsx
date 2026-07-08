import { Link } from "react-router-dom";

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium text-zinc-200">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-400">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container-page py-8 sm:py-10 lg:py-12 fade-in">
      <div className="mx-auto max-w-3xl">
        <div className="page-card section-stack">
          <div>
            <h1 className="page-title">Privacy Policy</h1>
            <p className="page-subtitle mt-2">
              Last updated: July 8, 2026
            </p>
          </div>

          <p className="text-sm leading-relaxed text-zinc-400">
            This Privacy Policy describes how <strong className="text-zinc-300">Songuess</strong>{" "}
            — a real-time multiplayer music trivia game developed as an academic
            project at 42 — collects, uses, and stores personal information.
            Songuess is currently an MVP intended for local development,
            testing, and evaluation only. It is not designed for public
            deployment on the Internet.
          </p>

          <LegalSection title="1. Data we store">
            <p>
              When you create an account or sign in, we store only the
              information needed to run the application:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-zinc-300">Account data:</strong> email
                address, username, and a bcrypt-hashed password (we never store
                your password in plain text).
              </li>
              <li>
                <strong className="text-zinc-300">Session data:</strong> hashed
                refresh tokens linked to your account, plus short-lived access
                tokens delivered through HTTP-only cookies (
                <code className="text-zinc-300">access_token</code>,{" "}
                <code className="text-zinc-300">refresh_token</code>).
              </li>
              <li>
                <strong className="text-zinc-300">Spotify profile data</strong>{" "}
                (optional, only if you sign in with Spotify): Spotify user ID,
                display name, email, profile image URL, your top artists and
                genres, and your most-listened tracks (recent and all-time).
                This data is refreshed each time you authenticate with Spotify.
              </li>
            </ul>
            <p>
              During active multiplayer matches, your display name and score are
              held in server memory so other players can see them. Match results
              are not permanently stored in our database.
            </p>
            <p>
              Your browser may also store a login flag, session timing values,
              and game cooldown timestamps in{" "}
              <code className="text-zinc-300">localStorage</code>. These are
              used for session management and gameplay mechanics only.
            </p>
          </LegalSection>

          <LegalSection title="2. Information obtained through Spotify OAuth">
            <p>
              If you choose &ldquo;Continue with Spotify,&rdquo; we redirect
              you to Spotify&apos;s authorization page. With your consent,
              Spotify shares profile and listening-taste data through the
              following scopes:{" "}
              <code className="text-zinc-300">user-read-email</code>,{" "}
              <code className="text-zinc-300">user-read-private</code>, and{" "}
              <code className="text-zinc-300">user-top-read</code>.
            </p>
            <p>
              From Spotify we receive your profile information (ID, email,
              display name, avatar) and your top artists, derived genres, and
              top tracks. Spotify OAuth access tokens are used only during the
              login callback and are <strong className="text-zinc-300">not</strong>{" "}
              stored long-term on our servers.
            </p>
            <p>
              Spotify is the only third-party service used for user
              authentication. We do not integrate with any other external login
              providers.
            </p>
          </LegalSection>

          <LegalSection title="3. How we use your data">
            <p>We use the data described above exclusively to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Create and manage your Songuess account and session.</li>
              <li>
                Display your profile and optional Spotify taste data inside the
                app.
              </li>
              <li>
                Identify you during multiplayer rooms and matches (display name
                and score).
              </li>
              <li>Keep the application secure and functioning correctly.</li>
            </ul>
            <p>
              We do not sell, rent, or share your personal data with third
              parties for marketing or advertising. Songuess has no
              monetization, no advertising, and no analytics or tracking
              services.
            </p>
          </LegalSection>

          <LegalSection title="4. Local and academic use">
            <p>
              Songuess is a student project built for the ft_transcendence
              curriculum at 42. It runs in a local development and evaluation
              environment. We do not operate it as a commercial or publicly
              hosted service, and we do not guarantee the same protections or
              availability you would expect from a production application.
            </p>
          </LegalSection>

          <LegalSection title="5. Data retention and deletion">
            <p>
              Account and Spotify profile data remain stored while your account
              exists. Session tokens expire automatically (access tokens after
              15 minutes; refresh tokens after 30 days, or sooner if you log
              out).
            </p>
            <p>
              Songuess does not currently offer an in-app account deletion
              feature. If you want your stored data removed, please contact the
              development team through their GitHub profiles listed on the{" "}
              <Link to="/" className="link">
                home page
              </Link>
              . We will handle deletion requests on a best-effort basis within
              this academic project context.
            </p>
          </LegalSection>

          <LegalSection title="6. Changes to this policy">
            <p>
              We may update this Privacy Policy as the project evolves during
              development and evaluation. The &ldquo;Last updated&rdquo; date at
              the top of this page will reflect the most recent revision.
            </p>
          </LegalSection>

          <p className="text-sm text-zinc-500">
            See also our{" "}
            <Link to="/terms" className="link">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
