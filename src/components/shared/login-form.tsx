"use client";

import { useActionState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { loginAction, type LoginState } from "@/server/auth/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-md p-6 sm:p-8">
      <div className="mb-6 space-y-2 text-center sm:text-left">
        <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Billetterie mariage
        </p>
        <h1 className="text-2xl font-bold text-text sm:text-[28px]">Connexion</h1>
        <p className="text-sm text-text-muted">
          Accès réservé aux administrateurs et contrôleurs de l&apos;événement.
        </p>
      </div>

      <form action={formAction} className="space-y-4" noValidate>
        <FormField label="E-mail ou identifiant" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            disabled={isPending}
            hasError={Boolean(state.error)}
          />
        </FormField>

        <FormField label="Mot de passe" htmlFor="password" required>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={isPending}
              hasError={Boolean(state.error)}
              className="pr-12"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-text-muted hover:text-text"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? (
                <EyeOff className="size-5" aria-hidden="true" />
              ) : (
                <Eye className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </FormField>

        {state.error ? (
          <ErrorState title="Connexion impossible" message={state.error} />
        ) : null}

        <Button type="submit" className="w-full" loading={isPending} disabled={isPending}>
          {!isPending ? <LogIn className="size-4" aria-hidden="true" /> : null}
          {isPending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
    </Card>
  );
}
