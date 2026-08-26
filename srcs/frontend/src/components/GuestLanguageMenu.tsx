import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { LanguagePickerGrid } from "./LanguagePickerGrid";

const MENU_EXIT_MS = 220;
const MENU_BACKDROP_Z = 55;
const MENU_PANEL_Z = 60;

type MenuState = "closed" | "open" | "closing";

type MenuPosition = {
  top: number;
  right: number;
};

function TranslateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
    >
      <path
        d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function GuestLanguageMenu() {
  const { t } = useTranslation();
  const [menuState, setMenuState] = useState<MenuState>("closed");
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const isOpen = menuState === "open";
  const isVisible = menuState !== "closed";

  function openMenu() {
    setMenuState("open");
  }

  function closeMenu() {
    setMenuState((state) => (state === "open" ? "closing" : state));
  }

  function toggleMenu() {
    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu();
  }

  useLayoutEffect(() => {
    if (!isVisible || !buttonRef.current) {
      setMenuPosition(null);
      return;
    }

    function updateMenuPosition() {
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isVisible]);

  useEffect(() => {
    if (menuState !== "closing") return;

    const timer = window.setTimeout(() => {
      setMenuState("closed");
    }, MENU_EXIT_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [menuState]);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Element;
      if (containerRef.current?.contains(target)) return;
      if (target.closest?.("[data-guest-lang-menu-panel]")) return;
      closeMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const menuPanel =
    isVisible && menuPosition
      ? createPortal(
          <div
            data-guest-lang-menu-panel
            role="menu"
            className={[
              "fixed w-60 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-[#141416] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
              menuState === "closing"
                ? "animate-guess-dropdown-exit"
                : "animate-guess-dropdown-enter",
            ].join(" ")}
            style={{
              top: menuPosition.top,
              right: menuPosition.right,
              zIndex: MENU_PANEL_Z,
            }}
          >
            <LanguagePickerGrid />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {isVisible
        ? createPortal(
            <div
              role="presentation"
              data-guest-lang-menu-backdrop
              className={[
                "focus-backdrop fixed inset-0 bg-zinc-950/30 backdrop-blur-[2px]",
                menuState === "closing"
                  ? "focus-backdrop-exit"
                  : "focus-backdrop-enter",
              ].join(" ")}
              style={{ zIndex: MENU_BACKDROP_Z }}
              onClick={closeMenu}
            />,
            document.body,
          )
        : null}

      {menuPanel}

      <div
        ref={containerRef}
        className="relative"
        style={{ zIndex: isVisible ? MENU_PANEL_Z : undefined }}
        onBlur={(event) => {
          if (!containerRef.current?.contains(event.relatedTarget as Node)) {
            closeMenu();
          }
        }}
      >
        <button
          ref={buttonRef}
          type="button"
          className={[
            "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7d046]/50 focus-visible:rounded-full",
            isOpen ? "text-[#f7d046]" : "text-zinc-200 hover:text-[#f7d046]",
          ].join(" ")}
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={t("header.change_lang")}
        >
          <TranslateIcon />
        </button>
      </div>
    </>
  );
}
