import { ShieldCheck } from "lucide-react";

import { AdminPlaceholderPage } from "@/components/admin/admin-placeholder-page";

export default function AdminControleursPage() {
  return (
    <AdminPlaceholderPage
      title="Contrôleurs"
      description="Comptes autorisés à scanner et contrôler les entrées."
      icon={ShieldCheck}
      nextPhaseLabel="dans une phase ultérieure"
    />
  );
}
