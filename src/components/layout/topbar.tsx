"use client";

import { Menu } from "lucide-react";

import { getAdminBreadcrumb } from "@/components/layout/admin-nav";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ROLE_LABELS, type AuthenticatedEventUser } from "@/types/auth";
import { logoutAction } from "@/server/auth/actions";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export interface TopbarProps {
  eventUser: AuthenticatedEventUser;
  onMenuClick: () => void;
  className?: string;
}

export function Topbar({ eventUser, onMenuClick, className }: TopbarProps) {
  const pathname = usePathname();
  const breadcrumbs = getAdminBreadcrumb(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex min-h-14 items-center justify-between gap-4 border-b border-border bg-surface px-4 py-2 sm:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="lg:hidden"
          aria-label="Ouvrir le menu de navigation"
          onClick={onMenuClick}
          icon={<Menu className="size-5" aria-hidden="true" />}
        >
          <span className="sr-only">Menu</span>
        </Button>
        <div className="min-w-0">
          <nav aria-label="Fil d'Ariane">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb}-${index}`} className="flex items-center gap-2">
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  <span
                    className={cn(
                      index === breadcrumbs.length - 1
                        ? "font-medium text-text"
                        : undefined,
                    )}
                  >
                    {crumb}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-text">{eventUser.displayName}</p>
          <p className="text-xs text-text-muted">{ROLE_LABELS[eventUser.role]}</p>
        </div>
        <ThemeToggle />
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" size="sm">
            Se déconnecter
          </Button>
        </form>
      </div>
    </header>
  );
}
