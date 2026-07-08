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

export default function TermsOfServicePage() {
  return (
    <div className="container-page py-8 sm:py-10 lg:py-12 fade-in">
      <div className="mx-auto max-w-3xl">
        <div className="page-card section-stack">
          <div>
            <h1 className="page-title">Terms of Service</h1>
            <p className="page-subtitle mt-2">
              Last updated: July 8, 2026
            </p>
          </div>

          <p className="text-sm leading-relaxed text-zinc-400">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of{" "}
            <strong className="text-zinc-300">Songuess</strong>, a real-time
            multiplayer music trivia game. By accessing or using Songuess, you
            agree to these Terms.
          </p>

          <LegalSection title="1. Academic project">
            <p>
              Songuess is an academic project developed by students at{" "}
              <strong className="text-zinc-300">42</strong> as part of the
              ft_transcendence curriculum. It is a learning exercise and MVP,
              not a commercial product or a publicly operated online service.
            </p>
          </LegalSection>

          <LegalSection title="2. Intended use">
            <p>
              Songuess is intended solely for local development, testing, and
              evaluation — including project reviews and peer assessments at 42.
              It is not designed for general public use on the Internet, and we
              do not offer it as a hosted service to external users.
            </p>
            <p>
              You may access Songuess only in environments where the project is
              deployed for academic purposes (for example, a local or
              school-provided setup used during evaluation).
            </p>
          </LegalSection>

          <LegalSection title="3. Acceptable use">
            <p>You agree to use Songuess responsibly and in good faith. You must not:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Attempt to disrupt, exploit, or reverse-engineer the application
                or its infrastructure.
              </li>
              <li>
                Use the service to harass, impersonate, or harm other players.
              </li>
              <li>
                Share credentials or attempt to access accounts that are not
                yours.
              </li>
              <li>
                Use automated tools or scripts to interfere with gameplay or
                server operations.
              </li>
            </ul>
            <p>
              We may restrict or terminate access if we determine that use is
              abusive or incompatible with the academic purpose of the project.
            </p>
          </LegalSection>

          <LegalSection title="4. No guarantee of availability">
            <p>
              Songuess is provided on an &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; basis. Because it is an MVP under active
              development, we do <strong className="text-zinc-300">not</strong>{" "}
              guarantee continuous availability, uptime, data persistence, or
              error-free operation. The service may be offline, reset, or
              unavailable at any time without notice — including during
              evaluations, demos, or development work.
            </p>
          </LegalSection>

          <LegalSection title="5. Changes during development">
            <p>
              The development team may add, modify, or remove features, rules,
              or data at any time as part of ongoing work on the project. Game
              mechanics, authentication flows, and stored data models may change
              without prior notice. You acknowledge that your experience may
              differ between versions and evaluation sessions.
            </p>
          </LegalSection>

          <LegalSection title="6. Spotify as a third-party service">
            <p>
              Songuess uses <strong className="text-zinc-300">Spotify</strong>{" "}
              solely for user authentication and, with your consent, to retrieve
              profile and listening-taste information used inside the app. Your
              use of Spotify login is also subject to Spotify&apos;s own terms
              and privacy policies.
            </p>
            <p>
              We are not affiliated with, endorsed by, or responsible for
              Spotify. If Spotify is unavailable or changes its API, Spotify
              login or related features in Songuess may stop working without
              notice.
            </p>
          </LegalSection>

          <LegalSection title="7. Accounts and content">
            <p>
              You are responsible for the accuracy of the information you
              provide when registering (email, username, and password) or when
              signing in with Spotify. You are responsible for maintaining the
              confidentiality of your credentials.
            </p>
            <p>
              Songuess does not claim ownership over music previews or metadata
              surfaced through Spotify during gameplay. All music-related content
              remains subject to Spotify&apos;s terms and applicable copyright
              law.
            </p>
          </LegalSection>

          <LegalSection title="8. Limitation of liability">
            <p>
              To the fullest extent permitted in this academic context, the
              developers of Songuess are not liable for any loss of data,
              interrupted gameplay, or other damages arising from use of this MVP.
              The project is provided free of charge, without monetization,
              advertising, or warranties of any kind.
            </p>
          </LegalSection>

          <LegalSection title="9. Contact">
            <p>
              For questions about these Terms or about your data, contact the
              development team through the GitHub profiles listed on the{" "}
              <Link to="/" className="link">
                home page
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection title="10. Changes to these Terms">
            <p>
              We may update these Terms as the project evolves. Continued use
              of Songuess after changes are published constitutes acceptance of
              the revised Terms. The &ldquo;Last updated&rdquo; date at the top
              of this page indicates the latest revision.
            </p>
          </LegalSection>

          <p className="text-sm text-zinc-500">
            See also our{" "}
            <Link to="/privacy" className="link">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
