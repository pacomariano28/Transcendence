import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <div className="container-page py-8 sm:py-10 lg:py-12 fade-in">
      <div className="mx-auto max-w-3xl">
        <div className="page-card section-stack">
          <div>
            <h1 className="page-title">{t("privacy.title")}</h1>
            <p className="page-subtitle mt-2">{t("privacy.lastUpdated")}</p>
          </div>

          <p className="text-sm leading-relaxed text-zinc-400">
            <Trans i18nKey="privacy.intro">
              This Privacy Policy describes how{" "}
              <strong className="text-zinc-300">Songuess</strong> — a real-time
              multiplayer music trivia game developed as an academic project at
              42 — collects, uses, and stores personal information. Songuess is
              currently an MVP intended for local development, testing, and
              evaluation only. It is not designed for public deployment on the
              Internet.
            </Trans>
          </p>

          <LegalSection title={t("privacy.sections.dataTitle")}>
            <p>{t("privacy.sections.dataIntro")}</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <Trans i18nKey="privacy.sections.dataRule1">
                  <strong className="text-zinc-300">Account data:</strong> email
                  address, username, and a bcrypt-hashed password (we never
                  store your password in plain text).
                </Trans>
              </li>
              <li>
                <Trans i18nKey="privacy.sections.dataRule2">
                  <strong className="text-zinc-300">Session data:</strong>{" "}
                  hashed refresh tokens linked to your account, plus short-lived
                  access tokens delivered through HTTP-only cookies (
                  <code className="text-zinc-300">access_token</code>,{" "}
                  <code className="text-zinc-300">refresh_token</code>).
                </Trans>
              </li>
              <li>
                <Trans i18nKey="privacy.sections.dataRule3">
                  <strong className="text-zinc-300">
                    Spotify profile data
                  </strong>{" "}
                  (optional, only if you sign in with Spotify): Spotify user ID,
                  display name, email, profile image URL, your top artists and
                  genres, and your most-listened tracks (recent and all-time).
                  This data is refreshed each time you authenticate with
                  Spotify.
                </Trans>
              </li>
            </ul>
            <p>{t("privacy.sections.dataOutro1")}</p>
            <p>
              <Trans i18nKey="privacy.sections.dataOutro2">
                Your browser may also store a login flag, session timing values,
                and game cooldown timestamps in{" "}
                <code className="text-zinc-300">localStorage</code>. These are
                used for session management and gameplay mechanics only.
              </Trans>
            </p>
          </LegalSection>

          <LegalSection title={t("privacy.sections.spotifyTitle")}>
            <p>
              <Trans i18nKey="privacy.sections.spotifyBody1">
                If you choose &ldquo;Continue with Spotify,&rdquo; we redirect
                you to Spotify&apos;s authorization page. With your consent,
                Spotify shares profile and listening-taste data through the
                following scopes:{" "}
                <code className="text-zinc-300">user-read-email</code>,{" "}
                <code className="text-zinc-300">user-read-private</code>, and{" "}
                <code className="text-zinc-300">user-top-read</code>.
              </Trans>
            </p>
            <p>
              <Trans i18nKey="privacy.sections.spotifyBody2">
                From Spotify we receive your profile information (ID, email,
                display name, avatar) and your top artists, derived genres, and
                top tracks. Spotify OAuth access tokens are used only during the
                login callback and are{" "}
                <strong className="text-zinc-300">not</strong> stored long-term
                on our servers.
              </Trans>
            </p>
            <p>{t("privacy.sections.spotifyBody3")}</p>
          </LegalSection>

          <LegalSection title={t("privacy.sections.useTitle")}>
            <p>{t("privacy.sections.useIntro")}</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>{t("privacy.sections.useRule1")}</li>
              <li>{t("privacy.sections.useRule2")}</li>
              <li>{t("privacy.sections.useRule3")}</li>
              <li>{t("privacy.sections.useRule4")}</li>
            </ul>
            <p>{t("privacy.sections.useOutro")}</p>
          </LegalSection>

          <LegalSection title={t("privacy.sections.academicTitle")}>
            <p>{t("privacy.sections.academicBody")}</p>
          </LegalSection>

          <LegalSection title={t("privacy.sections.retentionTitle")}>
            <p>{t("privacy.sections.retentionBody1")}</p>
            <p>
              {/* FIXED: Passing components array to match <1> tag in JSON */}
              <Trans
                i18nKey="privacy.sections.retentionBody2"
                components={[<span />, <Link to="/" className="link" />]}
              >
                Songuess does not currently offer an in-app account deletion
                feature. If you want your stored data removed, please contact
                the development team through their GitHub profiles listed on the{" "}
                <Link to="/" className="link">
                  home page
                </Link>
                . We will handle deletion requests on a best-effort basis within
                this academic project context.
              </Trans>
            </p>
          </LegalSection>

          <LegalSection title={t("privacy.sections.changesTitle")}>
            <p>{t("privacy.sections.changesBody")}</p>
          </LegalSection>

          <p className="text-sm text-zinc-500">
            {/* FIXED: Passing object configuration to exactly match <TermsLink> in JSON */}
            <Trans
              i18nKey="privacy.seeAlso"
              components={{ TermsLink: <Link to="/terms" className="link" /> }}
            >
              See also our{" "}
              <Link to="/terms" className="link">
                Terms of Service
              </Link>
              .
            </Trans>
          </p>
        </div>
      </div>
    </div>
  );
}
