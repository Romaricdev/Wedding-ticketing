import Link from "next/link";
import {
  Armchair,
  ArrowRight,
  Camera,
  History,
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
  const { event, stats, recentAttempts } = await getDashboardData(eventUser.event.id);
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
            label="Billets créés"
            value={stats.ticketsCount}
            href="/admin/billets"
            icon={<Ticket className="size-5" />}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="space-y-5 rounded-sm p-5">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" aria-hidden="true" /><h2 className="text-lg font-semibold text-text">Suivi des entrées</h2></div><Link href="/admin/historique" className="text-sm font-medium text-primary hover:underline">Voir l’historique</Link></div>
          <div><div className="flex items-end justify-between gap-3"><div><p className="text-3xl font-bold tabular-nums text-text">{stats.acceptedChecksCount}<span className="text-lg font-medium text-text-muted"> / {stats.ticketsCount}</span></p><p className="mt-1 text-sm text-text-muted">billets validés à l’entrée</p></div><p className="text-sm font-medium text-text-muted">{stats.ticketsCount ? Math.round((stats.acceptedChecksCount / stats.ticketsCount) * 100) : 0}%</p></div><div className="mt-3 h-2 overflow-hidden bg-surface-subtle"><div className="h-full bg-success transition-all" style={{ width: `${stats.ticketsCount ? Math.min(100, (stats.acceptedChecksCount / stats.ticketsCount) * 100) : 0}%` }} /></div></div>
          <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm"><div><p className="text-text-muted">Restant à contrôler</p><p className="mt-1 text-xl font-semibold tabular-nums text-text">{Math.max(stats.ticketsCount - stats.acceptedChecksCount, 0)}</p></div><div><p className="text-text-muted">Tentatives refusées</p><p className="mt-1 text-xl font-semibold tabular-nums text-text">{Math.max(stats.checksCount - stats.acceptedChecksCount, 0)}</p></div></div>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Actions rapides</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><Link href="/admin/invites" className="group flex items-center justify-between border border-border px-3 py-2.5 text-sm font-medium text-text transition-colors hover:border-primary/40 hover:bg-primary-subtle">Ajouter un invité <ArrowRight className="size-4 text-text-muted group-hover:text-primary" /></Link><Link href="/admin/billets" className="group flex items-center justify-between border border-border px-3 py-2.5 text-sm font-medium text-text transition-colors hover:border-primary/40 hover:bg-primary-subtle">Créer un billet <ArrowRight className="size-4 text-text-muted group-hover:text-primary" /></Link><Link href="/controle/scan" className="group flex items-center justify-between border border-border px-3 py-2.5 text-sm font-medium text-text transition-colors hover:border-primary/40 hover:bg-primary-subtle">Ouvrir le scanner <Camera className="size-4 text-text-muted group-hover:text-primary" /></Link></div></div>
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
          {recentAttempts.length === 0 ? <EmptyState title="Aucune entrée enregistrée" description="Les scans et validations apparaîtront ici dès le premier contrôle." /> : <div className="divide-y divide-border border-y border-border">{recentAttempts.map((attempt) => { const accepted = attempt.result === "ACCEPTED" || attempt.result === "MANUAL_ACCEPTED"; const guests = attempt.ticket?.guests.map((guest) => `${guest.lastName} ${guest.firstNames}`).join(" · "); return <div key={attempt.id} className="flex items-center justify-between gap-3 px-1 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-text">{guests ?? "QR code non reconnu"}</p><p className="mt-0.5 text-xs text-text-muted">{attempt.ticket ? `Table ${attempt.ticket.tableLabel}` : "Aucun billet associé"} · {new Date(attempt.scannedAt).toLocaleString("fr-FR")}</p></div><StatusBadge status={accepted ? "success" : "danger"} label={accepted ? "Validé" : "Refusé"} /></div>; })}</div>}
        </Card>
      </section>
    </div>
  );
}
