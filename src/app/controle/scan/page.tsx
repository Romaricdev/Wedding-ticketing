import { ScanLine, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireControllerOrAdmin } from "@/server/auth";

export default async function ScanPage() {
  await requireControllerOrAdmin();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text sm:text-[28px]">Scanner</h1>
        <p className="text-sm text-text-muted sm:text-base">
          Interface de contrôle des entrées par QR code. La caméra et la validation
          serveur seront disponibles en Phase 6.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div
          className="flex min-h-[280px] flex-col items-center justify-center gap-4 bg-surface-subtle px-6 py-12 text-center sm:min-h-[360px]"
          aria-hidden="true"
        >
          <div className="flex size-24 items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface">
            <ScanLine className="size-12 text-text-muted" />
          </div>
          <p className="max-w-md text-sm text-text-muted">
            Zone caméra — le flux vidéo et la détection QR seront intégrés ici.
          </p>
        </div>
      </Card>

      <Card className="space-y-3 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-text">Phase 6 — Check-in</h2>
        <p className="text-sm text-text-muted">
          Le scanner utilisera la caméra arrière, interrogera le serveur pour chaque
          QR et affichera un résultat clair (autorisé, déjà utilisé, invalide). Sans
          connexion Internet, aucune validation ne sera possible.
        </p>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="secondary" disabled className="sm:flex-1">
          <Search className="size-4" aria-hidden="true" />
          Recherche manuelle
        </Button>
      </div>
      <p className="text-sm text-text-muted">
        La recherche manuelle sera activée en Phase 6. Seul un administrateur pourra
        confirmer une entrée manuelle.
      </p>
    </div>
  );
}
