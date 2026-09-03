"use client";

import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  createTableAction,
  updateTableAction,
  type TableFormState,
} from "@/server/tables/actions";
import type { TableWithStats } from "@/types/tables";

const initialState: TableFormState = {};

export interface TableFormProps {
  mode: "create" | "edit";
  tableId?: string;
  defaultValues?: {
    label: string;
    capacity: string;
  };
  onSuccess?: (table: TableWithStats) => void;
  onCancel?: () => void;
}

export function TableForm({ mode, tableId, defaultValues, onSuccess, onCancel }: TableFormProps) {
  const action =
    mode === "create"
      ? createTableAction
      : updateTableAction.bind(null, tableId ?? "");

  const [state, formAction, isPending] = useActionState(action, {
    ...initialState,
    values: defaultValues,
  });

  const values = state.values ?? defaultValues ?? { label: "", capacity: "" };

  useEffect(() => {
    if (state.success && state.table) {
      onSuccess?.(state.table);
    }
  }, [onSuccess, state.success, state.table]);

  if (isPending) {
    return (
      <LoadingState
        label={mode === "create" ? "Création de la table…" : "Enregistrement des modifications…"}
        className="py-10"
      />
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormField
        label="Nom ou numéro de table"
        htmlFor="label"
        required
        help="Exemple : 12 ou Table d'honneur"
        error={state.fieldErrors?.label}
      >
        <Input
          id="label"
          name="label"
          defaultValue={values.label}
          required
          disabled={isPending}
          hasError={Boolean(state.fieldErrors?.label)}
          placeholder="12"
        />
      </FormField>

      <FormField
        label="Capacité"
        htmlFor="capacity"
        required
        help="La capacité correspond au nombre maximal de personnes."
        error={state.fieldErrors?.capacity}
      >
        <Input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          max={200}
          step={1}
          inputMode="numeric"
          defaultValue={values.capacity}
          required
          disabled={isPending}
          hasError={Boolean(state.fieldErrors?.capacity)}
          placeholder="8"
        />
      </FormField>

      {state.error ? (
        <ErrorState title="Enregistrement impossible" message={state.error} />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" loading={isPending} disabled={isPending}>
          {mode === "create" ? "Créer la table" : "Enregistrer les modifications"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
