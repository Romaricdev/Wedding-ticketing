"use server";

import { redirect } from "next/navigation";

import { signInWithPassword, signOut } from "@/server/auth";
import { AuthError } from "@/types/auth";

export type LoginState = {
  error?: string;
};

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Veuillez renseigner l'identifiant et le mot de passe." };
  }

  try {
    const { redirectTo } = await signInWithPassword(email, password);
    redirect(redirectTo);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    if (error instanceof AuthError) {
      return { error: error.message };
    }

    return {
      error: "La connexion au serveur est indisponible. Vérifiez Internet puis réessayez.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  try {
    await signOut();
    redirect("/connexion");
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    throw error;
  }
}
