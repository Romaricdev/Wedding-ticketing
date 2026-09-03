import Link from "next/link";
import {
  Armchair,
  History,
  ListChecks,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { type ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatEventMeta,
  getDashboardData,
} from "@/server/admin/dashboard";
import { requireAdmin } from "@/server/auth";

interface MetricCardProps {
  label: string;
  value: number;
  href: string;
  icon: ReactNode;
}

function MetricCard({ label, value, href, icon }: MetricCardProps) {
  return (
    <Link href={href} className="group block text-inherit focus-visible:outline-none">
      <Card className="relative flex h-full flex-col gap-3 overflow-hidden border-border p-4 shadow-[0_2px_4px_rgb(29_29_31_/_6%)] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:origin-bottom before:scale-y-0 before:bg-primary before:transition-transform before:duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/35 group-hover:bg-surface group-hover:shadow-[0_10px_22px_rgb(29_29_31_/_10%)] group-hover:before:scale-y-100 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-focus">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-text-muted transition-colors group-hover:text-text">{label}</p>
          <div className="rounded-sm bg-surface-subtle p-2 text-text-muted transition-colors group-hover:bg-primary-subtle group-hover:text-primary" aria-hidden="true">
            {icon}
          </div>
        </div>
        <p className="text-3xl font-bold tabular-nums tracking-tight text-text">{value}</p>
      </Card>
    </Link>
  );
}

export default async function AdminPage() {
  const eventUser = await requireAdmin();
  const { event, stats } = await getDashboardData(eventUser.event.id);
  const eventMeta = formatEventMeta(event);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de la préparation de l'événement."
        meta={
          eventMeta ? (
            <p>
              <span className="font-medium text-text">{event.name}</span>
              {eventMeta ? ` · ${eventMeta}` : null}
            </p>
          ) : (
            <p className="font-medium text-text">{event.name}</p>
          )
        }
        actions={
          <Link
            href="/admin/invites"
            className="inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover hover:text-white"
          >
            Voir les invités
          </Link>
        }
      />

      <section aria-labelledby="dashboard-metrics-title">
        <h2 id="dashboard-metrics-title" className="sr-only">
          Métriques
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Tables configurées"
            value={stats.tablesCount}
            href="/admin/tables"
            icon={<Armchair className="size-5" />}
          />
          <MetricCard
            label="Invités enregistrés"
            value={stats.guestsCount}
            href="/admin/invites"
            icon={<Users className="size-5" />}
          />
          <MetricCard
            label="Contrôleurs actifs"
            value={stats.controllersCount}
            href="/admin/controleurs"
            icon={<ShieldCheck className="size-5" />}
          />
          <MetricCard
            label="Billets générés"
            value={stats.ticketsCount}
            href="/admin/billets"
            icon={<Ticket className="size-5" />}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="space-y-4 rounded-sm p-5">
          <div className="flex items-center gap-2">
            <ListChecks className="size-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-text">Prochaines étapes</h2>
          </div>
          <ul className="space-y-3 text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <StatusBadge status="info" label="Phase 3" />
              <span>Finaliser la configuration des tables et des places.</span>
            </li>
            <li className="flex items-start gap-2">
              <StatusBadge status="info" label="Phase 4" />
              <span>Compléter la liste des invités et leurs affectations.</span>
            </li>
            <li className="flex items-start gap-2">
              <StatusBadge status="info" label="Phase 5" />
              <span>Créer les billets Single et Couple, puis générer les PDF.</span>
            </li>
            <li className="flex items-start gap-2">
              <StatusBadge status="warning" label="Phase 6" />
              <span>Activer le scanner caméra le jour de l&apos;événement.</span>
            </li>
          </ul>
        </Card>

        <Card className="space-y-4 rounded-sm p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-text">Dernières entrées</h2>
            </div>
            <Link href="/admin/historique" className="text-sm font-medium text-info hover:text-info">
              Voir l&apos;historique complet
            </Link>
          </div>
          <EmptyState
            title="Aucune entrée enregistrée"
            description="Les scans et validations apparaîtront ici une fois le check-in activé en Phase 6."
          />
        </Card>
      </section>
    </div>
  );
}
