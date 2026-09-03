import { ControleShell } from "@/components/layout/controle-shell";
import {
  redirectForAuthError,
  requireControllerOrAdmin,
} from "@/server/auth";
import { AuthError } from "@/types/auth";

export default async function ControleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let eventUser;

  try {
    eventUser = await requireControllerOrAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      redirectForAuthError(error);
    }

    throw error;
  }

  return <ControleShell eventUser={eventUser}>{children}</ControleShell>;
}
