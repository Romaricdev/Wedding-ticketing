"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Renders overlays outside animated layout containers so they always cover the full viewport. */
export function ModalPortal({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted) return null;

  return createPortal(children, document.body);
}
