import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ErrorState } from "@/components/ui/error-state";
import {
  redirectForAuthError,
  requireAdmin,
} from "@/server/auth";
import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseConnectionError } from "@/lib/database-errors";
import { AuthError } from "@/types/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let eventUser;

  try {
    eventUser = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError && error.code === "FORBIDDEN") {
      redirect("/controle/scan");
    }

    if (error instanceof AuthError) {
      redirectForAuthError(error);
    }

    if (isDatabaseConnectionError(error)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
          <div className="w-full max-w-lg">
            <ErrorState title="Base de données indisponible" message={DATABASE_UNAVAILABLE_MESSAGE} />
          </div>
        </div>
      );
    }

    throw error;
  }

  return <AppShell eventUser={eventUser}>{children}</AppShell>;
}
