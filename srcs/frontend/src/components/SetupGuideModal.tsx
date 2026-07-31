import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type { SetupManualStep, SetupStatus } from "../api/setup";
import { fetchSetupStatus } from "../api/setup";

const PANEL_EXIT_MS = 220;
const BACKDROP_Z = 70;
const PANEL_Z = 75;
const SETUP_HOST_KEY = "songuessSetupHost";
const SETUP_DISMISS_KEY = "songuessSetupDismissed";

type PanelState = "closed" | "open" | "closing";

type SetupGuideModalProps = {
  status: SetupStatus | null;
  hostChanged: boolean;
  onDismiss: () => void;
};

function StepBadge({ severity }: { severity: SetupManualStep["severity"] }) {
  const styles =
    severity === "error"
      ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
      : severity === "warning"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
        : "border-sky-400/25 bg-sky-400/10 text-sky-100";

  return (
    <span
      className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${styles}`}
    >
      {severity}
    </span>
  );
}

export default function SetupGuideModal({
  status,
  hostChanged,
  onDismiss,
}: SetupGuideModalProps) {
  const { t } = useTranslation();
  const [panelState, setPanelState] = useState<PanelState>("open");
  const isVisible = panelState !== "closed";

  const closePanel = useCallback(() => {
    if (panelState === "closing" || panelState === "closed") return;
    setPanelState("closing");
    window.setTimeout(() => {
      setPanelState("closed");
      onDismiss();
    }, PANEL_EXIT_MS);
  }, [onDismiss, panelState]);

  useEffect(() => {
    if (!isVisible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanel, isVisible]);

  if (!status || panelState === "closed") return null;

  const redirectUri = status.checks.spotifyOAuth.redirectUri;

  return createPortal(
    <>
      <button
        type="button"
        aria-label={t("setup.close")}
        className={[
          "focus-backdrop fixed inset-0 bg-zinc-950/55 backdrop-blur-[3px]",
          panelState === "closing"
            ? "focus-backdrop-exit"
            : "focus-backdrop-enter",
        ].join(" ")}
        style={{ zIndex: BACKDROP_Z }}
        onClick={closePanel}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("setup.title")}
        className={[
          "playlist-picker-panel fixed left-1/2 top-1/2 flex w-[min(94vw,34rem)] max-h-[min(86vh,40rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#141416] shadow-[0_24px_70px_rgba(0,0,0,0.62)]",
          panelState === "closing"
            ? "playlist-picker-panel-exit"
            : "playlist-picker-panel-enter",
        ].join(" ")}
        style={{ zIndex: PANEL_Z }}
      >
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                {t("setup.eyebrow")}
              </div>
              <h2 className="mt-1 text-lg font-semibold text-zinc-100">
                {hostChanged ? t("setup.titleNewMachine") : t("setup.title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {hostChanged
                  ? t("setup.introNewMachine")
                  : t("setup.intro")}
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
              onClick={closePanel}
            >
              {t("setup.close")}
            </button>
          </div>

          {status.autoApplied.length > 0 ? (
            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/8 px-3 py-2.5">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-300/80">
                {t("setup.autoAppliedTitle")}
              </div>
              <ul className="mt-1.5 space-y-1 text-xs text-emerald-100/90">
                {status.autoApplied.map((item) => (
                  <li key={item}>• {t(`setup.autoApplied.${item}`)}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {status.playableWithoutSpotify ? (
            <div className="mt-3 rounded-xl border border-[#f7d046]/25 bg-[#f7d046]/8 px-3 py-2.5 text-xs text-[#f7d046]">
              {t("setup.playWithoutSpotify")}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">
            {t("setup.checksTitle")}
          </div>

          <div className="grid gap-2 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <span className="text-zinc-300">{t("setup.checkServices")}</span>
              <span
                className={
                  status.checks.services.ok ? "text-emerald-300" : "text-rose-300"
                }
              >
                {status.checks.services.ok
                  ? t("setup.statusOk")
                  : t("setup.statusFail")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <span className="text-zinc-300">{t("setup.checkSongLibrary")}</span>
              <span
                className={
                  status.checks.songLibrary.ok
                    ? "text-emerald-300"
                    : "text-rose-300"
                }
              >
                {status.checks.songLibrary.ok
                  ? t("setup.songCount", {
                      count: status.checks.songLibrary.count,
                    })
                  : t("setup.songCountLow", {
                      count: status.checks.songLibrary.count,
                      minimum: status.checks.songLibrary.minimum,
                    })}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <span className="text-zinc-300">{t("setup.checkSpotifySearch")}</span>
              <span
                className={
                  status.checks.spotifySearch.ok
                    ? "text-emerald-300"
                    : "text-amber-200"
                }
              >
                {status.checks.spotifySearch.ok
                  ? t("setup.statusOk")
                  : t("setup.statusOptional")}
              </span>
            </div>
          </div>

          {status.manualSteps.length > 0 ? (
            <div className="mt-5">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">
                {t("setup.manualTitle")}
              </div>
              <div className="grid gap-2.5">
                {status.manualSteps.map((step) => (
                  <div
                    key={step.id}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <StepBadge severity={step.severity} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-zinc-100">
                          {t(`setup.steps.${step.id}.title`)}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                          {t(`setup.steps.${step.id}.body`, {
                            accessUrl: status.accessUrl,
                            redirectUri: redirectUri ?? status.accessUrl,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <button
            type="button"
            className="btn-glow w-full p-3"
            style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
            onClick={closePanel}
          >
            <span>{t("setup.continue")}</span>
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}

export function useSetupGuide() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [visible, setVisible] = useState(false);
  const [hostChanged, setHostChanged] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const currentHost = window.location.host;
    const knownHost = localStorage.getItem(SETUP_HOST_KEY);
    const dismissedForHost = sessionStorage.getItem(SETUP_DISMISS_KEY);
    const machineChanged = Boolean(knownHost && knownHost !== currentHost);

    if (!knownHost || machineChanged) {
      localStorage.setItem(SETUP_HOST_KEY, currentHost);
    }

    let cancelled = false;

    async function run() {
      try {
        const nextStatus = await fetchSetupStatus();
        if (cancelled) return;

        setStatus(nextStatus);
        setHostChanged(machineChanged);

        const hasBlocking = nextStatus.manualSteps.some(
          (step) => step.severity === "error",
        );
        const hasWarnings = nextStatus.manualSteps.some(
          (step) => step.severity === "warning",
        );
        const shouldShow =
          machineChanged ||
          hasBlocking ||
          (hasWarnings && dismissedForHost !== currentHost);

        if (shouldShow) {
          setVisible(true);
        }
      } catch {
        if (cancelled) return;
        if (machineChanged) {
          setHostChanged(true);
          setVisible(true);
          setStatus({
            ok: false,
            accessUrl: window.location.origin,
            playableWithoutSpotify: false,
            autoApplied: [],
            checks: {
              services: {
                ok: false,
                auth: false,
                content: false,
                game: false,
                playlist: false,
              },
              songLibrary: { ok: false, count: 0, minimum: 5 },
              spotifySearch: { ok: false, configured: false },
              spotifyOAuth: {
                ok: false,
                redirectUri: null,
                redirectMatches: false,
              },
            },
            manualSteps: [{ id: "run_make_up", severity: "error" }],
          });
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(SETUP_DISMISS_KEY, window.location.host);
    setVisible(false);
  }, []);

  return { status, visible, hostChanged, dismiss };
}
