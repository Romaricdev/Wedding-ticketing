"use client";

import { CalendarCog, FileText, Globe2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tab = "event" | "landing" | "ticket";

const tabs: Array<{
  id: Tab;
  label: string;
  description: string;
  icon: typeof CalendarCog;
}> = [
  {
    id: "event",
    label: "Événement",
    description: "Identité et production",
    icon: CalendarCog,
  },
  {
    id: "landing",
    label: "Page d’accueil",
    description: "Contenu vu par les invités",
    icon: Globe2,
  },
  {
    id: "ticket",
    label: "Billet & QR",
    description: "Template et zone du QR code",
    icon: FileText,
  },
];

export function SettingsWorkspace({
  event,
  landing,
  ticket,
}: {
  event: ReactNode;
  landing: ReactNode;
  ticket: ReactNode;
}) {
  const [active, setActive] = useState<Tab>("event");
  const content = { event, landing, ticket };
  return (
    <div className="space-y-5">
      <div className="grid gap-2 rounded-xl border border-border bg-surface p-2 shadow-sm sm:grid-cols-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex items-start gap-3 rounded-lg px-3 py-3 text-left transition duration-200 ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 active:translate-y-0",
                selected
                  ? "bg-primary-subtle text-text shadow-sm ring-1 ring-primary/15"
                  : "text-text-muted hover:bg-surface-subtle hover:text-text",
              )}
              aria-pressed={selected}
            >
              <Icon
                className={cn(
                  "mt-0.5 size-4",
                  selected ? "text-primary" : "text-text-muted",
                )}
              />
              <span>
                <span className="block text-sm font-semibold">{tab.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed">
                  {tab.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {(Object.keys(content) as Tab[]).map((tab) => (
        <div
          key={tab}
          hidden={active !== tab}
          className={active === tab ? "animate-settings-panel" : undefined}
        >
          {content[tab]}
        </div>
      ))}
    </div>
  );
}
