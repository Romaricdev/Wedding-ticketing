import { EventRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertUserCanAccessApp,
  getActiveEventUser,
  requireAdmin,
  requireControllerOrAdmin,
  requireEventUser,
  requireUser,
} from "@/server/auth";
import {
  getDefaultRouteForRole,
  isAdmin,
  isControllerOrAdmin,
} from "@/types/auth";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    eventUser: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const mockEventUser = {
  id: "event-user-1",
  eventId: "event-1",
  authUserId: "auth-1",
  displayName: "Admin démo",
  role: EventRole.ADMIN,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  event: {
    id: "event-1",
    name: "Mariage de démonstration",
    status: "ACTIVE",
  },
};

const mockController = {
  ...mockEventUser,
  id: "event-user-2",
  authUserId: "auth-2",
  displayName: "Contrôleur démo",
  role: EventRole.CONTROLLER,
};

describe("helpers de rôle", () => {
  it("identifie correctement les rôles", () => {
    expect(isAdmin({ role: EventRole.ADMIN })).toBe(true);
    expect(isAdmin({ role: EventRole.CONTROLLER })).toBe(false);
    expect(isControllerOrAdmin({ role: EventRole.CONTROLLER })).toBe(true);
    expect(isControllerOrAdmin({ role: EventRole.ADMIN })).toBe(true);
  });

  it("retourne la route par défaut selon le rôle", () => {
    expect(getDefaultRouteForRole(EventRole.ADMIN)).toBe("/admin");
    expect(getDefaultRouteForRole(EventRole.CONTROLLER)).toBe("/controle/scan");
  });
});

describe("helpers serveur auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requireUser rejette une session absente", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    await expect(requireUser()).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("requireEventUser exige un event_user actif", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-1", email: "admin@example.com" } },
        }),
      },
    } as never);

    vi.mocked(prisma.eventUser.findFirst).mockResolvedValue(null);

    await expect(requireEventUser()).rejects.toMatchObject({
      code: "NOT_EVENT_USER",
    });
  });

  it("requireAdmin autorise un administrateur actif", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-1", email: "admin@example.com" } },
        }),
      },
    } as never);

    vi.mocked(prisma.eventUser.findFirst).mockResolvedValue(mockEventUser);

    await expect(requireAdmin()).resolves.toEqual(mockEventUser);
  });

  it("requireAdmin refuse un contrôleur", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-2", email: "controller@example.com" } },
        }),
      },
    } as never);

    vi.mocked(prisma.eventUser.findFirst).mockResolvedValue(mockController);

    await expect(requireAdmin()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("requireControllerOrAdmin autorise un contrôleur", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-2", email: "controller@example.com" } },
        }),
      },
    } as never);

    vi.mocked(prisma.eventUser.findFirst).mockResolvedValue(mockController);

    await expect(requireControllerOrAdmin()).resolves.toEqual(mockController);
  });

  it("assertUserCanAccessApp refuse un utilisateur désactivé", async () => {
    vi.mocked(prisma.eventUser.findFirst).mockResolvedValue({
      ...mockController,
      isActive: false,
    });

    await expect(assertUserCanAccessApp("auth-2")).rejects.toMatchObject({
      code: "INACTIVE_USER",
    });
  });

  it("requireEventUser refuse un compte inactif", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-2", email: "controller@example.com" } },
        }),
      },
    } as never);

    vi.mocked(prisma.eventUser.findFirst).mockResolvedValue(null);

    await expect(requireEventUser()).rejects.toMatchObject({
      code: "NOT_EVENT_USER",
    });
  });

  it("getActiveEventUser ignore les comptes inactifs", async () => {
    vi.mocked(prisma.eventUser.findFirst).mockResolvedValue(null);

    await expect(getActiveEventUser("auth-2")).resolves.toBeNull();
  });
});
