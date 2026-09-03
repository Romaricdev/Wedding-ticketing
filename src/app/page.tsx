import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <main className="w-full max-w-lg">
        <Card className="space-y-6 p-6 sm:p-8">
          <div className="space-y-2">
            <Badge variant="success">Phase 0</Badge>
            <h1 className="text-2xl font-bold tracking-tight text-text sm:text-[28px]">
              Billetterie mariage
            </h1>
            <p className="text-base text-text-muted">
              Application privée de gestion d&apos;invitations et de contrôle
              d&apos;accès par QR code à usage unique.
            </p>
          </div>

          <div
            className="flex items-start gap-3 rounded-md border border-border bg-success-subtle p-4"
            role="status"
          >
            <CheckCircle2
              className="mt-0.5 size-5 shrink-0 text-success"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="font-semibold text-success">Environnement initialisé</p>
              <p className="text-sm text-text-muted">
                Next.js, TypeScript strict, Tailwind CSS, Prisma, Supabase, tests
                et design system de base sont configurés. Les fonctionnalités métier
                seront implémentées à partir de la Phase 1.
              </p>
            </div>
          </div>

          <p className="text-sm text-text-muted">
            Consultez le README du dépôt pour les instructions d&apos;installation
            et de développement.
          </p>
        </Card>
      </main>
    </div>
  );
}
