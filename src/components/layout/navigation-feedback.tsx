"use client";

import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationFeedback() {
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isNavigating = pendingPath !== null && pendingPath !== pathname;

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!target || target.target === "_blank" || target.hasAttribute("download")) return;
      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === pathname) return;
      setPendingPath(destination.pathname);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setPendingPath(null), 10_000);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  if (!isNavigating) return null;

  return <>
    <div className="fixed inset-x-0 top-0 z-[200] h-0.5 overflow-hidden bg-primary/15" aria-hidden="true"><div className="h-full w-2/3 animate-navigation-progress bg-primary" /></div>
    <div className="fixed right-4 top-16 z-[200] inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text shadow-overlay" role="status" aria-live="polite"><Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" /> Chargement…</div>
  </>;
}
