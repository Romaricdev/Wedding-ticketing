import { resolveLandingContent } from "@/lib/landing-content";
import { prisma } from "@/lib/prisma";

export async function getPublicLandingContent() {
  const event = await prisma.event.findFirst({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "asc" },
    select: { landingContent: true },
  });
  return resolveLandingContent(event?.landingContent);
}
