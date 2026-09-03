import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function Pagination({ page, totalItems, pageSize, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50, 100], itemLabel = "éléments", className }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize && !onPageSizeChange) return null;
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  const visiblePages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((item) => item === 1 || item === pageCount || Math.abs(item - safePage) <= 1);

  return <nav aria-label={`Pagination des ${itemLabel}`} className={cn("flex flex-col gap-3 border-t border-border pt-3 lg:flex-row lg:items-center lg:justify-between", className)}>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><p className="text-sm tabular-nums text-text-muted">{start}–{end} sur {totalItems} {itemLabel}</p>{onPageSizeChange ? <label className="flex items-center gap-2 text-sm text-text-muted">Afficher <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="h-9 rounded-sm border border-border bg-surface px-2 text-sm text-text transition-colors hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" aria-label="Nombre d’éléments par page">{pageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select> par page</label> : null}</div>
    <div className="flex items-center gap-1" role="list">
      <button type="button" onClick={() => onPageChange(safePage - 1)} disabled={safePage === 1} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-sm border border-border bg-surface text-text-muted transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-45" aria-label="Page précédente"><ChevronLeft className="size-4" aria-hidden="true" /></button>
      {visiblePages.map((item, index) => <span key={item} className="contents">{index > 0 && item - visiblePages[index - 1] > 1 ? <span className="inline-flex min-h-9 min-w-6 items-center justify-center text-text-muted" aria-hidden="true">…</span> : null}<button type="button" onClick={() => onPageChange(item)} aria-current={item === safePage ? "page" : undefined} className={cn("inline-flex min-h-9 min-w-9 items-center justify-center rounded-sm border text-sm font-medium transition-colors", item === safePage ? "border-primary bg-primary text-white" : "border-border bg-surface text-text hover:bg-surface-subtle")}>{item}</button></span>)}
      <button type="button" onClick={() => onPageChange(safePage + 1)} disabled={safePage === pageCount} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-sm border border-border bg-surface text-text-muted transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-45" aria-label="Page suivante"><ChevronRight className="size-4" aria-hidden="true" /></button>
    </div>
  </nav>;
}
