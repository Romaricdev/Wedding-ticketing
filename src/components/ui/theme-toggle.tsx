"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";
const KEY = "wedding-ticketing-theme";

function applyTheme(theme: Theme) { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; }

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem(KEY);
      const next: Theme = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
      setTheme(next); applyTheme(next);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const toggle = () => { const next: Theme = theme === "dark" ? "light" : "dark"; setTheme(next); window.localStorage.setItem(KEY, next); applyTheme(next); };
  const isDark = theme === "dark";
  return <Button type="button" variant="ghost" size="sm" className="min-w-9 px-2" onClick={toggle} aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"} icon={isDark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}><span className="sr-only">{isDark ? "Mode clair" : "Mode sombre"}</span></Button>;
}
