/**
 * Persists lock cooldown across reloads (localStorage) and drives the lock-button UI timer.
 * Penalty duration is written by useMatchSocket on wrong guess / round resume.
 */
import { useEffect, useMemo, useState } from "react";
import {
  clearStoredCooldown,
  readStoredCooldownEnd,
} from "../../utils/matchCooldown";
import { SECOND_MS } from "../constants";

export function useMatchCooldown(code: string, initialCode: string) {
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(() =>
    readStoredCooldownEnd(initialCode),
  );
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const storedEnd = code ? readStoredCooldownEnd(code) : null;
    const timerId = window.setTimeout(() => {
      setCooldownEndsAt(storedEnd);
      setNowMs(Date.now());
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [code]);

  useEffect(() => {
    if (!code || cooldownEndsAt === null) return undefined;

    const tick = () => {
      const now = Date.now();
      if (now >= cooldownEndsAt) {
        clearStoredCooldown(code);
        setCooldownEndsAt(null);
        return;
      }
      setNowMs(now);
    };

    if (Date.now() >= cooldownEndsAt) {
      clearStoredCooldown(code);
      const expiryTimer = window.setTimeout(() => setCooldownEndsAt(null), 0);
      return () => window.clearTimeout(expiryTimer);
    }

    tick();
    const timerId = window.setInterval(tick, SECOND_MS);
    return () => window.clearInterval(timerId);
  }, [code, cooldownEndsAt]);

  const { isCooldownActive, cooldownSeconds } = useMemo(() => {
    const active = cooldownEndsAt !== null && cooldownEndsAt > nowMs;
    return {
      isCooldownActive: active,
      cooldownSeconds: active
        ? Math.ceil((cooldownEndsAt - nowMs) / SECOND_MS)
        : 0,
    };
  }, [cooldownEndsAt, nowMs]);

  return {
    cooldownEndsAt,
    setCooldownEndsAt,
    isCooldownActive,
    cooldownSeconds,
  };
}
