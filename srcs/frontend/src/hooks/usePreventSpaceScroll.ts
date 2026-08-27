import { useEffect } from "react";

function allowsSpaceDefault(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  if (target.isContentEditable) return true;

  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "BUTTON" || tag === "A") return true;

  const role = target.getAttribute("role");
  if (
    role === "button" ||
    role === "link" ||
    role === "checkbox" ||
    role === "radio" ||
    role === "combobox" ||
    role === "menuitem" ||
    role === "tab"
  ) {
    return true;
  }

  return Boolean(
    target.closest(
      'button, a, input, textarea, select, [contenteditable="true"], [role="button"], [role="link"], [role="combobox"]',
    ),
  );
}

export function usePreventSpaceScroll() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      if (allowsSpaceDefault(event.target)) return;
      event.preventDefault();
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);
}
