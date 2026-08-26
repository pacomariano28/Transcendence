import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "../i18n/languages";
import { UserAvatar } from "./UserAvatar";

const MENU_EXIT_MS = 220;
const MENU_BACKDROP_Z = 55;
const MENU_PANEL_Z = 60;

type MenuState = "closed" | "open" | "closing";

type UserAvatarMenuProps = {
  username?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  displayName?: string | null;
  onLogout: () => void | Promise<void>;
};

type MenuPosition = {
  top: number;
  right: number;
};

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.418 0-8 2.015-8 4.5V20h16v-1.5c0-2.485-3.582-4.5-8-4.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M10 17l1.5-1.5L8 12h9v-2H8l3.5-3.5L10 5l-6 7 6 7z"
        fill="currentColor"
      />
      <path d="M20 5h-2v14h2V5z" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

function menuItemClassName(extra = "") {
  return [
    "flex w-full items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
    "hover:border-white/10 hover:bg-white/10 active:scale-[0.98]",
    extra,
  ].join(" ");
}

export default function UserAvatarMenu({
  username,
  email,
  imageUrl,
  displayName,
  onLogout,
}: UserAvatarMenuProps) {
  const { t, i18n } = useTranslation();
  const [menuState, setMenuState] = useState<MenuState>("closed");
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const isOpen = menuState === "open";
  const isVisible = menuState !== "closed";
  const currentLangBase = (i18n.language || "en").split("-")[0];

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
      if (target.closest?.("[data-user-menu-panel]")) return;
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

  function changeLanguage(lang: SupportedLanguage) {
    i18n.changeLanguage(lang);
  }

  async function handleLogout() {
    closeMenu();
    await onLogout();
  }

  const menuPanel =
    isVisible && menuPosition
      ? createPortal(
          <div
            data-user-menu-panel
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
            <NavLink
              to="/profile"
              role="menuitem"
              className={menuItemClassName("text-zinc-100")}
              onClick={closeMenu}
            >
              <ProfileIcon />
              <span>{t("header.nav_profile")}</span>
            </NavLink>

            <div className="my-2 border-t border-white/10" />

            <div className="px-1">
              <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">
                {t("header.change_lang")}
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1.5">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isActive = currentLangBase === lang;

                  return (
                    <button
                      key={lang}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      className={[
                        "rounded-xl border px-2.5 py-2 text-xs font-medium uppercase tracking-wider transition-all duration-200 active:scale-[0.98]",
                        isActive
                          ? "border-[#f7d046]/40 bg-[#f7d046]/10 text-[#f7d046] shadow-[0_0_12px_rgba(247,208,70,0.12)]"
                          : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
                      ].join(" ")}
                      onClick={() => changeLanguage(lang)}
                    >
                      {LANGUAGE_LABELS[lang]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="my-2 border-t border-white/10" />

            <button
              type="button"
              role="menuitem"
              className={menuItemClassName(
                "text-rose-300 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-200",
              )}
              onClick={handleLogout}
            >
              <LogoutIcon />
              <span>{t("header.logout")}</span>
            </button>
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
              data-user-menu-backdrop
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
        className="group relative"
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
          className="shrink-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7d046]/50"
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={t("header.user_menu")}
        >
          <UserAvatar
            username={username}
            email={email}
            imageUrl={imageUrl}
            active={isOpen}
          />
        </button>

        {displayName && !isVisible ? (
          <div
            className="user-avatar-tooltip pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-50 w-max max-w-[14rem] translate-y-1 rounded-xl border border-white/10 bg-[#141416]/95 px-3 py-2 opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.4)] group-hover:translate-y-0 group-hover:opacity-100"
            aria-hidden="true"
          >
            <span className="block text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">
              {t("header.signed_in_as")}
            </span>
            <span className="mt-1 block truncate text-sm font-medium text-zinc-100">
              {displayName}
            </span>
          </div>
        ) : null}
      </div>
    </>
  );
}
