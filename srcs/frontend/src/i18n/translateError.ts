import type { TFunction } from "i18next";
import { toGameServiceErrorCode } from "../match/gameServiceErrors";

const MATCH_ERROR_KEYS: Record<string, string> = {
  AUDIO_LOAD_FAILED: "match.errors.audioLoadFailed",
  SEARCH_FAILED: "match.errors.searchFailed",
};

export function translateError(code: string, t: TFunction): string {
  const normalized = toGameServiceErrorCode(code);

  const matchKey = MATCH_ERROR_KEYS[normalized];
  if (matchKey) return t(matchKey);

  const errorsKey = `errors.${normalized}`;
  const translated = t(errorsKey);
  if (translated !== errorsKey) return translated;

  return code;
}
