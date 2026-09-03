import { beforeEach, describe, expect, it, vi } from "vitest";

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
import { signInWithPassword } from "@/server/auth";

const mockAdminEventUser = {
  id: "event-user-1",
  eventId: "event-1",
  authUserId: "auth-1",
  displayName: "Admin démo",
  role: "ADMIN" as const,
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

describe("signInWithPassword", () => {
  const signOut = vi.fn();
  const signInWithPasswordMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        signInWithPassword: signInWithPasswordMock,
        signOut,
      },
    } as never);
  });

  it("redirige un administrateur actif vers /admin", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "auth-1", email: "admin@example.com" } },
      error: null,
    });

    vi.mocked(prisma.eventUser.findFirst).mockResolvedValue(mockAdminEventUser);
    vi.mocked(prisma.eventUser.update).mockResolvedValue(mockAdminEventUser);

    await expect(signInWithPassword("admin@example.com", "secret")).resolves.toEqual({
      eventUser: mockAdminEventUser,
      redirectTo: "/admin",
    });

    expect(prisma.eventUser.update).toHaveBeenCalledWith({
      where: { id: mockAdminEventUser.id },
      data: { lastLoginAt: expect.any(Date) },
    });
  });

  it("refuse un utilisateur désactivé et déconnecte la session Supabase", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "auth-2", email: "controller@example.com" } },
      error: null,
    });

    vi.mocked(prisma.eventUser.findFirst).mockResolvedValue({
      ...mockAdminEventUser,
      authUserId: "auth-2",
      role: "CONTROLLER",
      isActive: false,
    });

    await expect(signInWithPassword("controller@example.com", "secret")).rejects.toMatchObject({
      code: "INACTIVE_USER",
    });

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(prisma.eventUser.update).not.toHaveBeenCalled();
  });

  it("refuse des identifiants invalides sans appeler Prisma", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    await expect(signInWithPassword("bad@example.com", "wrong")).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });

    expect(prisma.eventUser.findFirst).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });
});
