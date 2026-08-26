import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/auth-context";
import { createMatchRoom } from "../match/createRoom";
import { translateError } from "../i18n/translateError";
import i18n from "../i18n/i18n";

export default function CreateRoomPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!user || started.current) return;

    started.current = true;

    async function run() {
      try {
        const playerName =
          user!.username ?? user!.email ?? i18n.t("match.user.guest");
        const matchId = await createMatchRoom(playerName);
        navigate(`/room/${matchId}`, { replace: true });
      } catch (err) {
        console.error("Error creating room:", err);
        setError(err instanceof Error ? err.message : String(err));
        started.current = false;
      }
    }

    void run();
  }, [user, navigate]);

  return (
    <div className="container-page grid min-h-[calc(100dvh-9rem)] place-items-center">
      <div className="mx-auto w-full max-w-2xl text-center">
        {error ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 nudge">
              <strong>{translateError(error, t)}</strong>
            </div>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate("/", { replace: true })}
            >
              {t("join.back")}
            </button>
          </div>
        ) : (
          <p className="text-zinc-400">{t("home.creating")}</p>
        )}
      </div>
    </div>
  );
}
