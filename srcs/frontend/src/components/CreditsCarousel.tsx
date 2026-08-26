import { useTranslation } from "react-i18next";

const DEVELOPERS = [
  { name: "frmarian", url: "https://github.com/pacomariano28" },
  { name: "smoore-a", url: "https://github.com/seilanmoore" },
  { name: "jortiz-m", url: "https://github.com/jortiz-m/jortiz-m" },
  { name: "stitovsk", url: "https://github.com/svetameanssun" },
  { name: "rjaada", url: "https://github.com/rjaada" },
] as const;

function DeveloperLink({ name, url }: { name: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="credits-marquee-item"
    >
      {name}
    </a>
  );
}

export default function CreditsCarousel() {
  const { t } = useTranslation();
  const items = [...DEVELOPERS, ...DEVELOPERS];

  return (
    <div className="credits-marquee" aria-label={t("home.made_by")}>
      <div className="credits-marquee-track">
        {items.map((dev, index) => (
          <DeveloperLink key={`${dev.name}-${index}`} {...dev} />
        ))}
      </div>
    </div>
  );
}
