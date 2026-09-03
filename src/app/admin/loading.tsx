export default function AdminLoading() {
  return <div className="animate-page-in space-y-5" aria-label="Chargement de la page" role="status">
    <div className="space-y-2"><div className="h-8 w-48 animate-pulse bg-surface-subtle" /><div className="h-5 w-80 max-w-full animate-pulse bg-surface-subtle" /></div>
    <div className="border border-border bg-surface p-4"><div className="h-11 w-full animate-pulse bg-surface-subtle" /><div className="mt-4 h-64 animate-pulse bg-surface-subtle" /></div>
  </div>;
}
