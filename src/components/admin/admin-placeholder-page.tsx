import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export interface AdminPlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  nextPhaseLabel: string;
}

export function AdminPlaceholderPage({
  title,
  description,
  icon: Icon,
  nextPhaseLabel,
}: AdminPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        title={`${title} — bientôt disponible`}
        description={`Cette section sera implémentée ${nextPhaseLabel}. Utilisez le tableau de bord pour suivre la préparation.`}
        icon={<Icon className="size-6" aria-hidden="true" />}
      />
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="text-sm text-text-muted">
          Retournez au tableau de bord pour consulter les métriques de seed.
        </p>
        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-text hover:bg-surface-subtle"
        >
          Tableau de bord
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Card>
    </div>
  );
}
