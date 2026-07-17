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

export default function TermsOfServicePage() {
  const { t } = useTranslation();

  return (
    <div className="container-page py-8 sm:py-10 lg:py-12 fade-in">
      <div className="mx-auto max-w-3xl">
        <div className="page-card section-stack">
          <div>
            <h1 className="page-title">{t("terms.title")}</h1>
            <p className="page-subtitle mt-2">{t("terms.lastUpdated")}</p>
          </div>

          <p className="text-sm leading-relaxed text-zinc-400">
            <Trans i18nKey="terms.intro">
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of{" "}
              <strong className="text-zinc-300">Songuess</strong>, a real-time
              multiplayer music trivia game. By accessing or using Songuess, you
              agree to these Terms.
            </Trans>
          </p>

          <LegalSection title={t("terms.sections.academicTitle")}>
            <p>
              <Trans i18nKey="terms.sections.academicBody">
                Songuess is an academic project developed by students at{" "}
                <strong className="text-zinc-300">42</strong> as part of the
                ft_transcendence curriculum. It is a learning exercise and MVP,
                not a commercial product or a publicly operated online service.
              </Trans>
            </p>
          </LegalSection>

          <LegalSection title={t("terms.sections.intendedTitle")}>
            <p>{t("terms.sections.intendedBody1")}</p>
            <p>{t("terms.sections.intendedBody2")}</p>
          </LegalSection>

          <LegalSection title={t("terms.sections.acceptableTitle")}>
            <p>{t("terms.sections.acceptableIntro")}</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>{t("terms.sections.acceptableRule1")}</li>
              <li>{t("terms.sections.acceptableRule2")}</li>
              <li>{t("terms.sections.acceptableRule3")}</li>
              <li>{t("terms.sections.acceptableRule4")}</li>
            </ul>
            <p>{t("terms.sections.acceptableOutro")}</p>
          </LegalSection>

          <LegalSection title={t("terms.sections.availabilityTitle")}>
            <p>
              <Trans i18nKey="terms.sections.availabilityBody">
                Songuess is provided on an &ldquo;as is&rdquo; and &ldquo;as
                available&rdquo; basis. Because it is an MVP under active
                development, we do{" "}
                <strong className="text-zinc-300">not</strong> guarantee
                continuous availability, uptime, data persistence, or error-free
                operation. The service may be offline, reset, or unavailable at
                any time without notice — including during evaluations, demos,
                or development work.
              </Trans>
            </p>
          </LegalSection>

          <LegalSection title={t("terms.sections.changesDevTitle")}>
            <p>{t("terms.sections.changesDevBody")}</p>
          </LegalSection>

          <LegalSection title={t("terms.sections.spotifyTitle")}>
            <p>
              <Trans i18nKey="terms.sections.spotifyBody1">
                Songuess uses <strong className="text-zinc-300">Spotify</strong>{" "}
                solely for user authentication and, with your consent, to
                retrieve profile and listening-taste information used inside the
                app. Your use of Spotify login is also subject to Spotify&apos;s
                own terms and privacy policies.
              </Trans>
            </p>
            <p>{t("terms.sections.spotifyBody2")}</p>
          </LegalSection>

          <LegalSection title={t("terms.sections.accountsTitle")}>
            <p>{t("terms.sections.accountsBody1")}</p>
            <p>{t("terms.sections.accountsBody2")}</p>
          </LegalSection>

          <LegalSection title={t("terms.sections.liabilityTitle")}>
            <p>{t("terms.sections.liabilityBody")}</p>
          </LegalSection>

          <LegalSection title={t("terms.sections.contactTitle")}>
            <p>
              {/* FIXED: Passing components array to match <1> tag in JSON */}
              <Trans
                i18nKey="terms.sections.contactBody"
                components={[<span />, <Link to="/" className="link" />]}
              >
                For questions about these Terms or about your data, contact the
                development team through the GitHub profiles listed on the{" "}
                <Link to="/" className="link">
                  home page
                </Link>
                .
              </Trans>
            </p>
          </LegalSection>

          <LegalSection title={t("terms.sections.changesTermsTitle")}>
            <p>{t("terms.sections.changesTermsBody")}</p>
          </LegalSection>

          <p className="text-sm text-zinc-500">
            {/* FIXED: Passing object configuration to exactly match <PrivacyLink> in JSON */}
            <Trans
              i18nKey="terms.seeAlso"
              components={{
                PrivacyLink: <Link to="/privacy" className="link" />,
              }}
            >
              See also our{" "}
              <Link to="/privacy" className="link">
                Privacy Policy
              </Link>
              .
            </Trans>
          </p>
        </div>
      </div>
    </div>
  );
}
