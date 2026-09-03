"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { NavigationFeedback } from "@/components/layout/navigation-feedback";
import type { AuthenticatedEventUser } from "@/types/auth";

export interface AppShellProps {
  eventUser: AuthenticatedEventUser;
  children: ReactNode;
}

export function AppShell({ eventUser, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <NavigationFeedback />
      <AdminSidebar
        eventName={eventUser.event.name}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar eventUser={eventUser} onMenuClick={() => setMobileOpen(true)} />
        <main key={pathname} className="animate-page-in flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
