import { TemplateSettingsClient } from "@/components/admin/templates/template-settings-client";
import { requireAdmin } from "@/server/auth";
import { getActiveTicketTemplateForEvent } from "@/server/templates/queries";

export default async function AdminParametresPage() {
  const eventUser = await requireAdmin();
  const template = await getActiveTicketTemplateForEvent(eventUser.eventId);
  return <TemplateSettingsClient initialTemplate={template} />;
}
