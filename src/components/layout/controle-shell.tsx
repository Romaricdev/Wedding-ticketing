import { type ReactNode } from "react";

import { NetworkStatus } from "@/components/ui/network-status";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { logoutAction } from "@/server/auth/actions";
import { ROLE_LABELS, type AuthenticatedEventUser } from "@/types/auth";

export interface ControleShellProps {
  eventUser: AuthenticatedEventUser;
  children: ReactNode;
}

export function ControleShell({ eventUser, children }: ControleShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-semibold text-text">
              {eventUser.event.name}
            </p>
            <p className="text-sm text-text-muted">
              {eventUser.displayName} · {ROLE_LABELS[eventUser.role]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NetworkStatus />
            <ThemeToggle />
            <form action={logoutAction}>
              <Button type="submit" variant="secondary" size="sm">
                Se déconnecter
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
