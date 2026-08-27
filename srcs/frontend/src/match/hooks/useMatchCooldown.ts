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
  const [cooldownUiTick, setCooldownUiTick] = useState(0);

  useEffect(() => {
    if (!code) {
      setCooldownEndsAt(null);
      return;
    }
    setCooldownEndsAt(readStoredCooldownEnd(code));
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
      setCooldownUiTick((value) => value + 1);
    };

    if (Date.now() >= cooldownEndsAt) {
      clearStoredCooldown(code);
      setCooldownEndsAt(null);
      return undefined;
    }

    tick();
    const timerId = window.setInterval(tick, SECOND_MS);
    return () => window.clearInterval(timerId);
  }, [code, cooldownEndsAt]);

  const { isCooldownActive, cooldownSeconds } = useMemo(() => {
    const active = cooldownEndsAt !== null && cooldownEndsAt > Date.now();
    return {
      isCooldownActive: active,
      cooldownSeconds: active
        ? Math.ceil((cooldownEndsAt - Date.now()) / SECOND_MS)
        : 0,
    };
  }, [cooldownEndsAt, cooldownUiTick]);

  return {
    cooldownEndsAt,
    setCooldownEndsAt,
    isCooldownActive,
    cooldownSeconds,
  };
}
