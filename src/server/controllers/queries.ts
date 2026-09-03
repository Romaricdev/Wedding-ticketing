import { EventRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
export async function listControllersForEvent(eventId: string) { return prisma.eventUser.findMany({ where: { eventId, role: EventRole.CONTROLLER }, select: { id: true, displayName: true, isActive: true, lastLoginAt: true, createdAt: true, _count: { select: { checkInAttempts: true } } }, orderBy: [{ isActive: "desc" }, { displayName: "asc" }] }); }
