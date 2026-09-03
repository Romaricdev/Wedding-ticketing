import { History } from "lucide-react";

import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";

export default function AdminHistoriquePage() {
  return (
    <AdminPlaceholderPage
      title="Historique"
      description="Journal des scans, validations et refus."
      icon={History}
      nextPhaseLabel="en Phase 7"
    />
  );
}
