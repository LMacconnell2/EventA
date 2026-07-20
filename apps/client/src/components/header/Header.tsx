import {
  ChevronDown,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import type { AuthenticatedUser } from "@/auth/auth-types";

import "./Header.css";

type HeaderProps = {
  user?: AuthenticatedUser | null;
  onLogout?: () => Promise<void> | void;
};

export function Header({
  user = null,
  onLogout,
}: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const menuContainerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        !menuContainerRef.current?.contains(target)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await onLogout?.();
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error("Unable to log out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="app-header">
      <div className="app-header__content">
        <Link
          to="/"
          className="app-header__brand"
          activeOptions={{
            exact: true,
          }}
        >
          <img
            src="/eventa-logo-light-lg.webp"
            alt="EventA"
            className="app-header__brand-image"
          />
        </Link>

        <nav
          className="app-header__nav"
          aria-label="Primary navigation"
        >
          <Link
            to="/"
            className="app-header__link"
            activeProps={{
              className:
                "app-header__link app-header__link--active",
            }}
            activeOptions={{
              exact: true,
            }}
          >
            Home
          </Link>

          <Link
            to="/find-events"
            className="app-header__link"
            activeProps={{
              className:
                "app-header__link app-header__link--active",
            }}
          >
            Events
          </Link>

          {user && (
            <Link
              to="/dashboard"
              className="app-header__link"
              activeProps={{
                className:
                  "app-header__link app-header__link--active",
              }}
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="app-header__account">
          {!user ? (
            <div className="app-header__auth-actions">
              <Link
                to="/login"
                className="app-header__login-link"
              >
                Log In
              </Link>

              <Link
                to="/signup"
                className="app-header__signup-link"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div
              className="app-user-menu"
              ref={menuContainerRef}
            >
              <button
                className="app-user-menu__trigger"
                type="button"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                aria-controls="app-user-dropdown"
                onClick={() =>
                  setIsUserMenuOpen(
                    (current) => !current,
                  )
                }
              >
                {user.image ? (
                  <img
                    className="app-user-menu__avatar"
                    src={user.image}
                    alt=""
                  />
                ) : (
                  <span
                    className="app-user-menu__initials"
                    aria-hidden="true"
                  >
                    {getInitials(user.name)}
                  </span>
                )}

                <span className="app-user-menu__name">
                  {user.name}
                </span>

                <ChevronDown
                  className={
                    isUserMenuOpen
                      ? "app-user-menu__chevron app-user-menu__chevron--open"
                      : "app-user-menu__chevron"
                  }
                  size={18}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>

              {isUserMenuOpen && (
                <div
                  id="app-user-dropdown"
                  className="app-user-menu__dropdown"
                  role="menu"
                >
                  <div className="app-user-menu__identity">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>

                  <div className="app-user-menu__divider" />

                  <Link
                    to="/profile"
                    className="app-user-menu__item"
                    role="menuitem"
                    onClick={() =>
                      setIsUserMenuOpen(false)
                    }
                  >
                    <UserRound
                      size={18}
                      aria-hidden="true"
                    />
                    Profile
                  </Link>

                  <Link
                    to="/settings"
                    className="app-user-menu__item"
                    role="menuitem"
                    onClick={() =>
                      setIsUserMenuOpen(false)
                    }
                  >
                    <Settings
                      size={18}
                      aria-hidden="true"
                    />
                    Settings
                  </Link>

                  <div className="app-user-menu__divider" />

                  <button
                    type="button"
                    className="app-user-menu__item app-user-menu__item--danger"
                    role="menuitem"
                    disabled={isLoggingOut}
                    onClick={() => void handleLogout()}
                  >
                    <LogOut
                      size={18}
                      aria-hidden="true"
                    />

                    {isLoggingOut
                      ? "Logging Out..."
                      : "Log Out"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");
}