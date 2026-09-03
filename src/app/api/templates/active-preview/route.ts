import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";
import { downloadPrivatePdf } from "@/server/tickets/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const eventUser = await requireAdmin();
    const template = await prisma.ticketTemplate.findFirst({
      where: { eventId: eventUser.eventId, isActive: true },
      orderBy: { createdAt: "desc" },
      select: { storageBucket: true, storagePath: true, originalFilename: true },
    });

    if (!template) {
      return new NextResponse("Aucun template actif.", { status: 404 });
    }

    const bytes = await downloadPrivatePdf({
      bucket: template.storageBucket,
      path: template.storagePath,
    });
    const filename = template.originalFilename.replace(/[\\"\r\n]/g, "-");
    const body = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Aperçu indisponible.", { status: 503 });
  }
}
