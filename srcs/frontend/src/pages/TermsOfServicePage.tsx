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

const legalComponents = {
  b: <strong className="text-zinc-300" />,
  code: <code className="text-zinc-300" />,
  home: <Link to="/" className="link" />,
  terms: <Link to="/terms" className="link" />,
  privacy: <Link to="/privacy" className="link" />,
};

export default function TermsOfServicePage() {
  const { t } = useTranslation();

  return (
    <div className="container-page py-8 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="page-card section-stack">
          <div>
            <h1 className="page-title">{t("terms.title")}</h1>
            <p className="page-subtitle mt-2">{t("terms.lastUpdated")}</p>
          </div>

          <p className="text-sm leading-relaxed text-zinc-400">
            <Trans i18nKey="terms.intro" components={legalComponents} />
          </p>

          <LegalSection title={t("terms.sections.academicTitle")}>
            <p>
              <Trans
                i18nKey="terms.sections.academicBody"
                components={legalComponents}
              />
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
              <Trans
                i18nKey="terms.sections.availabilityBody"
                components={legalComponents}
              />
            </p>
          </LegalSection>

          <LegalSection title={t("terms.sections.changesDevTitle")}>
            <p>{t("terms.sections.changesDevBody")}</p>
          </LegalSection>

          <LegalSection title={t("terms.sections.spotifyTitle")}>
            <p>
              <Trans
                i18nKey="terms.sections.spotifyBody1"
                components={legalComponents}
              />
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
              <Trans
                i18nKey="terms.sections.contactBody"
                components={legalComponents}
              />
            </p>
          </LegalSection>

          <LegalSection title={t("terms.sections.changesTermsTitle")}>
            <p>{t("terms.sections.changesTermsBody")}</p>
          </LegalSection>

          <p className="text-sm text-zinc-500">
            <Trans i18nKey="terms.seeAlso" components={legalComponents} />
          </p>
        </div>
      </div>
    </div>
  );
}
