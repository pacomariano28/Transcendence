export type DefaultCatalogEntry = {
  isrc: string;
  fileName: string;
};

/**
 * Fallback ISRC catalog (legacy Classic Mix mappings).
 * Used when the configured Spotify playlist cannot be read at boot.
 */
export const DEFAULT_PLAYLIST_CATALOG: DefaultCatalogEntry[] = [
  { isrc: "GBBKS0462496", fileName: "preview_001.mp3" },
  { isrc: "AUAP09000014", fileName: "preview_002.mp3" },
  { isrc: "AUAP09000020", fileName: "preview_003.mp3" },
  { isrc: "AUAP08000042", fileName: "preview_004.mp3" },
  { isrc: "AUAP08000046", fileName: "preview_005.mp3" },
  { isrc: "AUAP08000047", fileName: "preview_006.mp3" },
  { isrc: "ES5150700521", fileName: "preview_007.mp3" },
  { isrc: "ES6880400795", fileName: "preview_008.mp3" },
  { isrc: "ES6880400788", fileName: "preview_009.mp3" },
  { isrc: "USGF18714809", fileName: "preview_010.mp3" },
  { isrc: "AUAP07900028", fileName: "preview_011.mp3" },
  { isrc: "USSM19200317", fileName: "preview_012.mp3" },
  { isrc: "DEE861101522", fileName: "preview_013.mp3" },
  { isrc: "USSM10211589", fileName: "preview_014.mp3" },
  { isrc: "USGF19942501", fileName: "preview_015.mp3" },
  { isrc: "USMC17446153", fileName: "preview_016.mp3" },
  { isrc: "USGF18714806", fileName: "preview_018.mp3" },
  { isrc: "USPR38619998", fileName: "preview_019.mp3" },
  { isrc: "GBAJE7000057", fileName: "preview_020.mp3" },
  { isrc: "USAT21300959", fileName: "preview_021.mp3" },
];
