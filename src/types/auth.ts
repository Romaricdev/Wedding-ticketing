import { EventRole, type EventUser } from "@prisma/client";
import type { User } from "@supabase/supabase-js";

export type SessionUser = User;

export type AuthenticatedEventUser = EventUser & {
  event: {
    id: string;
    name: string;
    status: string;
  };
};

export type AuthErrorCode =
  | "UNAUTHENTICATED"
  | "INACTIVE_USER"
  | "NOT_EVENT_USER"
  | "FORBIDDEN";

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

export function isAdmin(eventUser: Pick<EventUser, "role">): boolean {
  return eventUser.role === EventRole.ADMIN;
}

export function isControllerOrAdmin(eventUser: Pick<EventUser, "role">): boolean {
  return eventUser.role === EventRole.ADMIN || eventUser.role === EventRole.CONTROLLER;
}

export function getDefaultRouteForRole(role: EventRole): string {
  return role === EventRole.ADMIN ? "/admin" : "/controle/scan";
}

export const ROLE_LABELS: Record<EventRole, string> = {
  [EventRole.ADMIN]: "Administrateur",
  [EventRole.CONTROLLER]: "Contrôleur",
};
