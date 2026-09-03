import { ControllersPageClient } from "@/components/admin/controllers/controllers-page-client";
import { requireAdmin } from "@/server/auth";
import { listControllersForEvent } from "@/server/controllers/queries";

export default async function AdminControleursPage() {
  const admin = await requireAdmin();
  return <ControllersPageClient initialControllers={await listControllersForEvent(admin.eventId)} />;
}
