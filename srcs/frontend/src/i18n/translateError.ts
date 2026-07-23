import type { TFunction } from "i18next";

const MATCH_ERROR_KEYS: Record<string, string> = {
  AUDIO_LOAD_FAILED: "match.errors.audioLoadFailed",
  SEARCH_FAILED: "match.errors.searchFailed",
};

export function translateError(code: string, t: TFunction): string {
  const matchKey = MATCH_ERROR_KEYS[code];
  if (matchKey) return t(matchKey);

  const errorsKey = `errors.${code}`;
  const translated = t(errorsKey);
  if (translated !== errorsKey) return translated;

  return code;
}
