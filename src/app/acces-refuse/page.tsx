import Link from "next/link";
import { ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { logoutAction } from "@/server/auth/actions";
import { getActiveEventUser, getSessionUser } from "@/server/auth";
import { EventRole } from "@prisma/client";
import { cn } from "@/lib/utils";

const primaryLinkClassName = cn(
  "inline-flex h-11 min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors",
  "bg-primary text-white hover:bg-primary-hover",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
);

export default async function AccesRefusePage() {
  const user = await getSessionUser();
  const eventUser = user ? await getActiveEventUser(user.id) : null;
  const homeHref =
    eventUser?.role === EventRole.ADMIN
      ? "/admin"
      : eventUser
        ? "/controle/scan"
        : "/connexion";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md space-y-6 p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-danger-subtle text-danger"
            aria-hidden="true"
          >
            <ShieldX className="size-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text">Accès non autorisé</h1>
            <p className="text-sm text-text-muted">
              Vous n&apos;avez pas la permission d&apos;accéder à cette page. Utilisez
              l&apos;espace correspondant à votre rôle ou reconnectez-vous.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {user ? (
            <>
              <Link href={homeHref} className={primaryLinkClassName}>
                Aller à mon espace
              </Link>
              <form action={logoutAction} className="flex-1">
                <Button type="submit" variant="secondary" className="w-full">
                  Se déconnecter
                </Button>
              </form>
            </>
          ) : (
            <Link href="/connexion" className={cn(primaryLinkClassName, "w-full")}>
              Se connecter
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}
