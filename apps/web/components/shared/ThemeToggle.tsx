"use client";
import { useState, useEffect } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    // Check saved preference or system preference
    const saved = localStorage.getItem("milaf_theme");
    if (saved === "light") {
      setDark(false);
      document.documentElement.classList.add("light");
    } else if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.remove("light");
    } else {
      // Default: check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(prefersDark);
      if (!prefersDark) document.documentElement.classList.add("light");
    }
  }, []);

  const toggle = () => {
    const newDark = !dark;
    setDark(newDark);
    if (newDark) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("milaf_theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("milaf_theme", "light");
    }
  };

  return (
    <button
      onClick={toggle}
      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${className}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        color: "var(--text-secondary)",
      }}
      title={dark ? "Mode clair" : "Mode sombre"}
    >
      {dark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M16.95 16.95l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M16.95 7.05l1.42-1.42" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
