"use client";

import { useMemo, useState } from "react";
import { Clock3, RefreshCw, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import type { CheckInAttemptRecord } from "@/types/check-in";

const resultLabels: Record<CheckInAttemptRecord["result"], string> = { ACCEPTED: "Entrée validée", MANUAL_ACCEPTED: "Validation manuelle", ALREADY_USED: "Déjà utilisé", CANCELLED: "Billet annulé", REVOKED: "Billet révoqué", INVALID: "QR invalide", DENIED: "Refusé" };
const successful = new Set<CheckInAttemptRecord["result"]>(["ACCEPTED", "MANUAL_ACCEPTED"]);

export function HistoryPageClient({ initialAttempts }: { initialAttempts: CheckInAttemptRecord[] }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("ALL");
  const [operator, setOperator] = useState("ALL");
  const [period, setPeriod] = useState("ALL");
  const [referenceTime] = useState(() => Date.now());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const operators = useMemo(() => Array.from(new Set(initialAttempts.map((item) => item.operatorName).filter((item): item is string => Boolean(item)))).sort(), [initialAttempts]);
  const attempts = useMemo(() => initialAttempts.filter((item) => {
    const searchable = `${item.ticket?.shortCode ?? ""} ${item.ticket?.guests.map((guest) => `${guest.lastName} ${guest.firstNames}`).join(" ") ?? ""}`.toLocaleLowerCase("fr-FR");
    const age = referenceTime - new Date(item.scannedAt).getTime();
    const inPeriod = period === "ALL" || (period === "TODAY" && new Date(item.scannedAt).toDateString() === new Date(referenceTime).toDateString()) || (period === "7D" && age <= 7 * 86_400_000) || (period === "30D" && age <= 30 * 86_400_000);
    return (!query || searchable.includes(query.toLocaleLowerCase("fr-FR"))) && (result === "ALL" || item.result === result) && (operator === "ALL" || item.operatorName === operator) && inPeriod;
  }), [initialAttempts, operator, period, query, referenceTime, result]);
  const pageCount = Math.max(1, Math.ceil(attempts.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleAttempts = attempts.slice((safePage - 1) * pageSize, safePage * pageSize);
  const reset = () => { setQuery(""); setResult("ALL"); setOperator("ALL"); setPeriod("ALL"); setPage(1); };
  const changed = Boolean(query || result !== "ALL" || operator !== "ALL" || period !== "ALL");

  return <div className="space-y-5"><PageHeader title="Historique des contrôles" description="Tous les scans et validations manuelles de l’événement." actions={<Button variant="secondary" icon={<RefreshCw className="size-4" aria-hidden="true" />} onClick={() => window.location.reload()}>Actualiser</Button>} /><FilterBar resultCount={attempts.length} resultLabel="contrôles" onReset={changed ? reset : undefined}><div className="grid w-full grid-cols-1 gap-3 xl:grid-cols-[minmax(260px,1fr)_190px_190px_170px]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="pl-10" placeholder="Rechercher un billet ou invité…" aria-label="Rechercher dans l’historique" /></div><Select value={result} onChange={(event) => { setResult(event.target.value); setPage(1); }} aria-label="Filtrer par résultat"><option value="ALL">Tous les résultats</option>{Object.entries(resultLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select value={operator} onChange={(event) => { setOperator(event.target.value); setPage(1); }} aria-label="Filtrer par contrôleur"><option value="ALL">Tous les contrôleurs</option>{operators.map((item) => <option key={item} value={item}>{item}</option>)}</Select><Select value={period} onChange={(event) => { setPeriod(event.target.value); setPage(1); }} aria-label="Filtrer par période"><option value="ALL">Toutes les dates</option><option value="TODAY">Aujourd’hui</option><option value="7D">7 derniers jours</option><option value="30D">30 derniers jours</option></Select></div></FilterBar><Surface className="overflow-hidden shadow-sm">{visibleAttempts.length === 0 ? <EmptyState title="Aucun contrôle trouvé" description={changed ? "Modifiez ou réinitialisez les filtres pour élargir la recherche." : "Les scans apparaîtront ici dès le début des contrôles."} /> : <><div className="divide-y divide-border">{visibleAttempts.map((attempt) => <HistoryRow key={attempt.id} attempt={attempt} />)}</div><div className="px-4 pb-3 sm:px-5"><Pagination page={safePage} totalItems={attempts.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} itemLabel="contrôles" /></div></>}</Surface></div>;
}

function HistoryRow({ attempt }: { attempt: CheckInAttemptRecord }) {
  const accepted = successful.has(attempt.result);
  const guests = attempt.ticket?.guests.map((guest) => `${guest.lastName} ${guest.firstNames}`).join(" · ");
  return <article className="grid gap-2 px-4 py-3 transition-colors hover:bg-surface-subtle/60 sm:grid-cols-[minmax(0,1fr)_170px_185px] sm:items-center sm:px-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-medium text-text">{guests ?? "QR code non reconnu"}</p>{attempt.isManual ? <Badge variant="neutral">Manuel</Badge> : null}</div><p className="mt-0.5 truncate text-sm text-text-muted">{attempt.ticket ? `${attempt.ticket.shortCode} · Table ${attempt.ticket.tableLabel}` : "Aucun billet associé"} · {attempt.operatorName ?? "Contrôleur inconnu"}</p></div><span className={cn("text-sm font-medium", accepted ? "text-success" : "text-danger")}>{resultLabels[attempt.result]}</span><span className="flex items-center gap-1 text-xs text-text-muted"><Clock3 className="size-3.5" aria-hidden="true" />{new Date(attempt.scannedAt).toLocaleString("fr-FR")}</span></article>;
}
