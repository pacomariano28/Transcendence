/**
 * Page transition timing — single place to tune navigation animations.
 *
 * Change these values to speed up or slow down fade-out / fade-in globally
 * (route changes, rematch scoreboard exit, etc.).
 */
export const PAGE_EXIT_MS = 200;
export const PAGE_ENTER_MS = 220;

/** Dim overlay while waiting for rematch response (optional tweak). */
export const PAGE_DIM_MS = 220;

export function applyPageTransitionDurations(): void {
  const root = document.documentElement;
  root.style.setProperty("--page-exit-ms", `${PAGE_EXIT_MS}ms`);
  root.style.setProperty("--page-enter-ms", `${PAGE_ENTER_MS}ms`);
  root.style.setProperty("--page-dim-ms", `${PAGE_DIM_MS}ms`);
}
