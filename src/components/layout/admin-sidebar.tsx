"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, type LucideIcon } from "lucide-react";

import {
  ADMIN_NAV_ITEMS,
  isAdminNavItemActive,
} from "@/components/layout/admin-nav";
import { cn } from "@/lib/utils";

export interface AdminSidebarProps {
  eventName: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
  compact = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={compact ? label : undefined}
      className={cn(
        "relative flex min-h-[44px] items-center rounded-sm transition-[background-color,color,transform] duration-150 ease-out hover:translate-x-px",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        compact
          ? "flex-col justify-center gap-1 px-1 py-2 text-[10px] font-medium leading-tight"
          : "gap-3 px-3 py-2 text-sm font-medium",
        active
          ? "bg-primary-subtle text-text before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:bg-primary"
          : "text-text-muted hover:bg-surface-subtle hover:text-text",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className={cn(compact ? "max-w-full truncate px-0.5 text-center" : "truncate")}>
        {label}
      </span>
    </Link>
  );
}

export function AdminSidebar({
  eventName,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const renderNavItems = (compact = false) =>
    ADMIN_NAV_ITEMS.map((item) => (
      <li key={item.href}>
        <NavLink
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={isAdminNavItemActive(pathname, item)}
          onNavigate={onMobileClose}
          compact={compact}
        />
      </li>
    ));

  return (
    <>
      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[min(100vw-3rem,240px)] flex-col border-r border-border bg-surface shadow-overlay transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        inert={mobileOpen ? undefined : true}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-text">Menu</span>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-text-muted hover:bg-surface-subtle hover:text-text"
            aria-label="Fermer le menu"
            onClick={onMobileClose}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="border-b border-border px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Événement
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-text">{eventName}</p>
        </div>
        <nav aria-label="Navigation mobile" className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">{renderNavItems()}</ul>
        </nav>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="animate-overlay-in fixed inset-0 z-30 bg-text/40 lg:hidden"
          aria-label="Fermer le menu de navigation"
          onClick={onMobileClose}
        />
      ) : null}

      {/* Tablette compacte */}
      <aside className="hidden w-20 shrink-0 flex-col border-r border-border bg-surface md:flex lg:hidden">
        <div className="border-b border-border px-2 py-4 text-center">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            Menu
          </p>
        </div>
        <nav aria-label="Navigation administrateur compacte" className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">{renderNavItems(true)}</ul>
        </nav>
      </aside>

      {/* Desktop */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Événement
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-text" title={eventName}>
            {eventName}
          </p>
        </div>
        <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">{renderNavItems()}</ul>
        </nav>
      </aside>
    </>
  );
}
