import { Prisma } from "@prisma/client";

export function isDatabaseConnectionError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P1001" || error.code === "P1002")
  );
}

export const DATABASE_UNAVAILABLE_MESSAGE =
  "Impossible de joindre la base de données. Vérifiez que le projet Supabase est actif, que DATABASE_URL dans .env.local est correct, puis réessayez.";
