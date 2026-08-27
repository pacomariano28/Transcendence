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

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="container-page py-8 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="page-card section-stack">
          <div>
            <h1 className="page-title">{t("privacy.title")}</h1>
            <p className="page-subtitle mt-2">{t("privacy.lastUpdated")}</p>
          </div>

          <p className="text-sm leading-relaxed text-zinc-400">
            <Trans i18nKey="privacy.intro" components={legalComponents} />
          </p>

          <LegalSection title={t("privacy.sections.dataTitle")}>
            <p>{t("privacy.sections.dataIntro")}</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <Trans
                  i18nKey="privacy.sections.dataRule1"
                  components={legalComponents}
                />
              </li>
              <li>
                <Trans
                  i18nKey="privacy.sections.dataRule2"
                  components={legalComponents}
                />
              </li>
              <li>
                <Trans
                  i18nKey="privacy.sections.dataRule3"
                  components={legalComponents}
                />
              </li>
            </ul>
            <p>{t("privacy.sections.dataOutro1")}</p>
            <p>
              <Trans
                i18nKey="privacy.sections.dataOutro2"
                components={legalComponents}
              />
            </p>
          </LegalSection>

          <LegalSection title={t("privacy.sections.spotifyTitle")}>
            <p>
              <Trans
                i18nKey="privacy.sections.spotifyBody1"
                components={legalComponents}
              />
            </p>
            <p>
              <Trans
                i18nKey="privacy.sections.spotifyBody2"
                components={legalComponents}
              />
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
              <Trans
                i18nKey="privacy.sections.retentionBody2"
                components={legalComponents}
              />
            </p>
          </LegalSection>

          <LegalSection title={t("privacy.sections.changesTitle")}>
            <p>{t("privacy.sections.changesBody")}</p>
          </LegalSection>

          <p className="text-sm text-zinc-500">
            <Trans i18nKey="privacy.seeAlso" components={legalComponents} />
          </p>
        </div>
      </div>
    </div>
  );
}
