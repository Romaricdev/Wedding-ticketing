import { TemplateSettingsClient } from "@/components/admin/templates/template-settings-client";
import { ProductionProfile } from "@/components/admin/settings/production-profile";
import { LandingContentSettings } from "@/components/admin/settings/landing-content-settings";
import { SettingsWorkspace } from "@/components/admin/settings/settings-workspace";
import { resolveLandingContent } from "@/lib/landing-content";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";
import { getActiveTicketTemplateForEvent } from "@/server/templates/queries";

export default async function AdminParametresPage() {
  const eventUser = await requireAdmin();
  const template = await getActiveTicketTemplateForEvent(eventUser.eventId);
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventUser.eventId },
    select: { name: true, venueName: true, weddingDate: true, landingContent: true },
  });
  return (
    <SettingsWorkspace
      event={
        <ProductionProfile
          eventName={event.name}
          venueName={event.venueName}
          weddingDate={event.weddingDate}
          displayName={eventUser.displayName}
        />
      }
      landing={
        <LandingContentSettings
          initialContent={resolveLandingContent(event.landingContent)}
        />
      }
      ticket={<TemplateSettingsClient initialTemplate={template} />}
    />
  );
}
