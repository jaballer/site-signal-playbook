import { useEffect, useState } from "react";
import { site } from "../../site.ts";

type Theme = "light" | "dark";
const CHANGE_EVENT = "ssp-theme-change";

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Flips between light and dark. With no saved choice, the page follows the OS setting. */
export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const sync = () => setTheme(currentTheme());
    sync();
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} theme`;

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(site.storageKeys.theme, next);
    } catch {
      // Storage can be unavailable (private windows, blocked site data); the toggle still works.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <button
      type="button"
      className="theme-btn"
      onClick={toggle}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
    >
      {next === "dark" ? <MoonIcon /> : <SunIcon />}
      {!compact && <span>{label}</span>}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
