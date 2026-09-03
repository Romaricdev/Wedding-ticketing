"use client";

import { useSearchParams } from "next/navigation";

import { GuestsListView } from "@/components/admin/guests/guests-list-view";
import type { GuestRecord } from "@/types/guests";

export interface GuestsPageClientProps {
  guests: GuestRecord[];
  loadError?: string;
}

export function GuestsPageClient({ guests, loadError }: GuestsPageClientProps) {
  const searchParams = useSearchParams();

  return (
    <GuestsListView
      initialGuests={guests}
      loadError={loadError}
      initialCreate={searchParams.get("create") === "1"}
    />
  );
}
