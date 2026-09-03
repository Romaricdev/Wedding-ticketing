import { TemplateSettingsClient } from "@/components/admin/templates/template-settings-client";
import { ProductionProfile } from "@/components/admin/settings/production-profile";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";
import { getActiveTicketTemplateForEvent } from "@/server/templates/queries";

export default async function AdminParametresPage() {
  const eventUser = await requireAdmin();
  const template = await getActiveTicketTemplateForEvent(eventUser.eventId);
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventUser.eventId }, select: { name: true, venueName: true, weddingDate: true } });
  return <div className="space-y-5"><ProductionProfile eventName={event.name} venueName={event.venueName} weddingDate={event.weddingDate} displayName={eventUser.displayName} /><TemplateSettingsClient initialTemplate={template} /></div>;
}
