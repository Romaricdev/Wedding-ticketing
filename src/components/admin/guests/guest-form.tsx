"use client";

import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Textarea } from "@/components/ui/textarea";
import {
  createGuestAction,
  updateGuestAction,
  type GuestFormState,
} from "@/server/guests/actions";
import type { GuestRecord } from "@/types/guests";

const initialState: GuestFormState = {};

export interface GuestFormProps {
  mode: "create" | "edit";
  guestId?: string;
  defaultValues?: {
    lastName: string;
    firstNames: string;
    notes: string;
  };
  onSuccess?: (guest: GuestRecord) => void;
  onCancel?: () => void;
}

export function GuestForm({
  mode,
  guestId,
  defaultValues,
  onSuccess,
  onCancel,
}: GuestFormProps) {
  const action =
    mode === "create"
      ? createGuestAction
      : updateGuestAction.bind(null, guestId ?? "");

  const [state, formAction, isPending] = useActionState(action, {
    ...initialState,
    values: defaultValues,
  });

  const values = state.values ??
    defaultValues ?? { lastName: "", firstNames: "", notes: "" };

  useEffect(() => {
    if (state.success && state.guest) {
      onSuccess?.(state.guest);
    }
  }, [onSuccess, state.guest, state.success]);

  if (isPending) {
    return (
      <LoadingState
        label={
          mode === "create"
            ? "Création de l'invité…"
            : "Enregistrement des modifications…"
        }
        className="py-10"
      />
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Nom"
          htmlFor="lastName"
          required
          error={state.fieldErrors?.lastName}
        >
          <Input
            id="lastName"
            name="lastName"
            defaultValue={values.lastName}
            required
            disabled={isPending}
            hasError={Boolean(state.fieldErrors?.lastName)}
            placeholder="Dupont"
            autoComplete="family-name"
          />
        </FormField>

        <FormField
          label="Prénoms"
          htmlFor="firstNames"
          required
          error={state.fieldErrors?.firstNames}
        >
          <Input
            id="firstNames"
            name="firstNames"
            defaultValue={values.firstNames}
            required
            disabled={isPending}
            hasError={Boolean(state.fieldErrors?.firstNames)}
            placeholder="Marie Claire"
            autoComplete="given-name"
          />
        </FormField>
      </div>

      <FormField
        label="Notes"
        htmlFor="notes"
        help="Facultatif. Non affiché aux contrôleurs par défaut."
        error={state.fieldErrors?.notes}
      >
        <Textarea
          id="notes"
          name="notes"
          defaultValue={values.notes}
          disabled={isPending}
          hasError={Boolean(state.fieldErrors?.notes)}
          placeholder="Allergie, besoin particulier…"
          rows={4}
        />
      </FormField>

      {state.error ? (
        <ErrorState title="Enregistrement impossible" message={state.error} />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" loading={isPending} disabled={isPending}>
          {mode === "create" ? "Créer l'invité" : "Enregistrer les modifications"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
