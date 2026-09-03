import { resolve } from "node:path";

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });

/** Valeurs alignées sur prisma/schema.prisma — évite d'importer les enums générés. */
const SeedEventRole = {
  ADMIN: "ADMIN",
  CONTROLLER: "CONTROLLER",
} as const;

const SeedEventStatus = {
  ACTIVE: "ACTIVE",
} as const;

const SeedGuestStatus = {
  ACTIVE: "ACTIVE",
} as const;

type SeedEventRoleValue = (typeof SeedEventRole)[keyof typeof SeedEventRole];

const prisma = new PrismaClient();

const DEMO_EVENT_NAME = "Mariage de démonstration";

type SeedUserConfig = {
  email: string;
  password: string;
  displayName: string;
  role: SeedEventRoleValue;
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Variable ${name} requise pour le seed. Consultez le README (section seed de développement).`,
    );
  }

  return value;
}

function getSeedUsers(): SeedUserConfig[] {
  return [
    {
      email: requireEnv("SEED_ADMIN_EMAIL"),
      password: requireEnv("SEED_ADMIN_PASSWORD"),
      displayName: "Administrateur démo",
      role: SeedEventRole.ADMIN,
    },
    {
      email: requireEnv("SEED_CONTROLLER1_EMAIL"),
      password: requireEnv("SEED_CONTROLLER1_PASSWORD"),
      displayName: "Contrôleur démo 1",
      role: SeedEventRole.CONTROLLER,
    },
    {
      email: requireEnv("SEED_CONTROLLER2_EMAIL"),
      password: requireEnv("SEED_CONTROLLER2_PASSWORD"),
      displayName: "Contrôleur démo 2",
      role: SeedEventRole.CONTROLLER,
    },
  ];
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const missing = [
    !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Variables manquantes dans .env.local pour le seed : ${missing.join(", ")}. Vérifiez qu'il n'y a pas d'espace après « = » ni de guillemets autour des valeurs.`,
    );
  }

  return createClient(url!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function findAuthUserIdByEmail(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  email: string,
): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) {
    throw error;
  }

  const match = data.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );

  return match?.id ?? null;
}

async function ensureAuthUser(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  config: SeedUserConfig,
): Promise<string> {
  const existingId = await findAuthUserIdByEmail(supabase, config.email);

  if (existingId) {
    const { error } = await supabase.auth.admin.updateUserById(existingId, {
      password: config.password,
      email_confirm: true,
      user_metadata: {
        display_name: config.displayName,
      },
    });

    if (error) {
      throw error;
    }

    return existingId;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: config.email,
    password: config.password,
    email_confirm: true,
    user_metadata: {
      display_name: config.displayName,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error(`Impossible de créer l'utilisateur ${config.email}.`);
  }

  return data.user.id;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Le seed de développement ne doit pas s'exécuter en production.");
  }

  const supabase = getSupabaseAdmin();
  const seedUsers = getSeedUsers();

  const event = await prisma.event.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {
      name: DEMO_EVENT_NAME,
      venueName: "Salle de réception démo",
      status: SeedEventStatus.ACTIVE,
    },
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      name: DEMO_EVENT_NAME,
      venueName: "Salle de réception démo",
      timezone: "Africa/Douala",
      status: SeedEventStatus.ACTIVE,
    },
  });

  for (const seedUser of seedUsers) {
    const authUserId = await ensureAuthUser(supabase, seedUser);

    await prisma.eventUser.upsert({
      where: {
        eventId_authUserId: {
          eventId: event.id,
          authUserId,
        },
      },
      update: {
        displayName: seedUser.displayName,
        role: seedUser.role,
        isActive: true,
      },
      create: {
        eventId: event.id,
        authUserId,
        displayName: seedUser.displayName,
        role: seedUser.role,
        isActive: true,
      },
    });
  }

  const tables = [
    { label: "Table 1", capacity: 8 },
    { label: "Table 2", capacity: 10 },
    { label: "Table d'honneur", capacity: 6 },
  ];

  const tableRecords = [];

  for (const table of tables) {
    const record = await prisma.diningTable.upsert({
      where: {
        eventId_label: {
          eventId: event.id,
          label: table.label,
        },
      },
      update: {
        capacity: table.capacity,
      },
      create: {
        eventId: event.id,
        label: table.label,
        capacity: table.capacity,
      },
    });

    tableRecords.push(record);
  }

  const guests = [
    {
      lastName: "Dupont",
      firstNames: "Jean",
      tableLabel: "Table 1",
    },
    {
      lastName: "Martin",
      firstNames: "Marie",
      tableLabel: "Table 1",
    },
    {
      lastName: "Ngono",
      firstNames: "Paul",
      tableLabel: "Table 2",
    },
    {
      lastName: "Essomba",
      firstNames: "Claire",
      tableLabel: "Table 2",
    },
    {
      lastName: "Fotso",
      firstNames: "Alain et Béatrice",
      tableLabel: "Table d'honneur",
    },
  ];

  for (const guest of guests) {
    const existing = await prisma.guest.findFirst({
      where: {
        eventId: event.id,
        lastName: guest.lastName,
        firstNames: guest.firstNames,
      },
    });

    if (existing) {
      await prisma.guest.update({
        where: { id: existing.id },
        data: {
          // Affectation table uniquement à l'émission du billet (Phase 5).
          tableId: null,
          status: SeedGuestStatus.ACTIVE,
        },
      });
      continue;
    }

    await prisma.guest.create({
      data: {
        eventId: event.id,
        lastName: guest.lastName,
        firstNames: guest.firstNames,
        tableId: null,
        status: SeedGuestStatus.ACTIVE,
      },
    });
  }

  const adminEventUser = await prisma.eventUser.findFirst({
    where: { eventId: event.id, role: SeedEventRole.ADMIN, isActive: true },
  });

  // Template PDF actif (Phase 5) — fond neutre + zone QR panneau droit.
  const { PDFDocument, rgb } = await import("pdf-lib");
  const { randomUUID } = await import("node:crypto");

  const TEMPLATES_BUCKET = "ticket-templates";
  const PDFS_BUCKET = "ticket-pdfs";

  for (const bucket of [TEMPLATES_BUCKET, PDFS_BUCKET]) {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((item) => item.name === bucket)) {
      await supabase.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 20 * 1024 * 1024,
        allowedMimeTypes: ["application/pdf"],
      });
    }
  }

  let template = await prisma.ticketTemplate.findFirst({
    where: { eventId: event.id, isActive: true },
  });

  if (!template) {
    const templateId = randomUUID();
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.98, 0.96, 0.93),
    });
    page.drawRectangle({
      x: 36,
      y: 36,
      width: width - 72,
      height: height - 72,
      borderColor: rgb(0.72, 0.62, 0.48),
      borderWidth: 1.5,
    });
    page.drawRectangle({
      x: 360,
      y: 560,
      width: 180,
      height: 220,
      borderColor: rgb(0.72, 0.62, 0.48),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });
    const pdfBytes = await pdfDoc.save();
    const storagePath = `events/${event.id}/templates/${templateId}/source.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(TEMPLATES_BUCKET)
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Échec upload template seed : ${uploadError.message}`);
    }

    await prisma.ticketTemplate.updateMany({
      where: { eventId: event.id, isActive: true },
      data: { isActive: false },
    });

    template = await prisma.ticketTemplate.create({
      data: {
        id: templateId,
        eventId: event.id,
        storageBucket: TEMPLATES_BUCKET,
        storagePath,
        originalFilename: "invitation-demo.pdf",
        pageNumber: 1,
        qrX: 450,
        qrY: 680,
        qrSize: 88,
        isActive: true,
        createdByUserId: adminEventUser?.id,
      },
    });
  }

  console.log("Seed de développement terminé.");
  console.log(`Événement : ${event.name}`);
  console.log(`Utilisateurs seed : ${seedUsers.map((user) => user.email).join(", ")}`);
  console.log(`Template PDF actif : ${template.originalFilename}`);
  console.log("Aucun billet généré par le seed (à créer via /admin/billets).");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
