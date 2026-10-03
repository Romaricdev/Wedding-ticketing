import Link from "next/link";

import { formatGuestFullName } from "@/lib/guests";
import { EmptyState } from "@/components/ui/empty-state";
import type { GuestRecord } from "@/types/guests";

interface TableAssignedGuestsProps {
  guests: GuestRecord[];
  tableLabel: string;
  showInviteLinks?: boolean;
}

export function TableAssignedGuests({
  guests,
  tableLabel,
  showInviteLinks = true,
}: TableAssignedGuestsProps) {
  if (guests.length === 0) {
    return (
      <EmptyState
        title="Aucun invité attribué"
        description={`Aucune personne active n'est affectée à la table « ${tableLabel} » pour le moment.`}
      />
    );
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {guests.map((guest) => {
        const fullName = formatGuestFullName(guest.lastName, guest.firstNames);
        return (
          <li
            key={guest.id}
            className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-text">{fullName}</p>
              {guest.notes ? (
                <p className="mt-0.5 truncate text-sm text-text-muted">{guest.notes}</p>
              ) : null}
            </div>
            {showInviteLinks ? (
              <Link
                href={`/admin/invites?search=${encodeURIComponent(guest.lastName)}`}
                className="shrink-0 text-sm font-medium text-primary hover:text-primary-hover"
              >
                Voir la fiche
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
