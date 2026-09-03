import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import {
  AuthError,
  type AuthenticatedEventUser,
  getDefaultRouteForRole,
  isAdmin,
  isControllerOrAdmin,
  type SessionUser,
} from "@/types/auth";
import { EventRole } from "@prisma/client";

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const getActiveEventUser = cache(async (
  authUserId: string,
): Promise<AuthenticatedEventUser | null> => {
  return prisma.eventUser.findFirst({
    where: {
      authUserId,
      isActive: true,
    },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    throw new AuthError("UNAUTHENTICATED", "Authentification requise.");
  }

  return user;
}

export async function requireEventUser(): Promise<AuthenticatedEventUser> {
  const user = await requireUser();
  const eventUser = await getActiveEventUser(user.id);

  if (!eventUser) {
    throw new AuthError(
      "NOT_EVENT_USER",
      "Ce compte n'est associé à aucun événement actif.",
    );
  }

  return eventUser;
}

export async function requireAdmin(): Promise<AuthenticatedEventUser> {
  const eventUser = await requireEventUser();

  if (!isAdmin(eventUser)) {
    throw new AuthError("FORBIDDEN", "Accès réservé aux administrateurs.");
  }

  return eventUser;
}

export async function requireControllerOrAdmin(): Promise<AuthenticatedEventUser> {
  const eventUser = await requireEventUser();

  if (!isControllerOrAdmin(eventUser)) {
    throw new AuthError("FORBIDDEN", "Accès réservé aux contrôleurs et administrateurs.");
  }

  return eventUser;
}

export async function assertUserCanAccessApp(authUserId: string): Promise<AuthenticatedEventUser> {
  const eventUser = await prisma.eventUser.findFirst({
    where: { authUserId },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!eventUser || !eventUser.isActive) {
    throw new AuthError(
      "INACTIVE_USER",
      "Ce compte est désactivé ou non autorisé pour cet événement.",
    );
  }

  return eventUser;
}

export async function recordSuccessfulLogin(eventUserId: string): Promise<void> {
  await prisma.eventUser.update({
    where: { id: eventUserId },
    data: { lastLoginAt: new Date() },
  });
}

export function redirectForAuthError(error: AuthError): never {
  switch (error.code) {
    case "UNAUTHENTICATED":
    case "INACTIVE_USER":
    case "NOT_EVENT_USER":
      redirect("/connexion");
    case "FORBIDDEN":
      redirect("/acces-refuse");
    default:
      redirect("/connexion");
  }
}

export function redirectToRoleHome(role: EventRole): never {
  redirect(getDefaultRouteForRole(role));
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ eventUser: AuthenticatedEventUser; redirectTo: string }> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new AuthError(
      "UNAUTHENTICATED",
      "Identifiants invalides ou service indisponible.",
    );
  }

  try {
    const eventUser = await assertUserCanAccessApp(data.user.id);
    await recordSuccessfulLogin(eventUser.id);

    return {
      eventUser,
      redirectTo: getDefaultRouteForRole(eventUser.role),
    };
  } catch (accessError) {
    await supabase.auth.signOut();

    if (accessError instanceof AuthError) {
      throw accessError;
    }

    throw new AuthError(
      "INACTIVE_USER",
      "Ce compte est désactivé ou non autorisé pour cet événement.",
    );
  }
}

export { AuthError } from "@/types/auth";
export { createBrowserSupabaseClient, createServerSupabaseClient };
