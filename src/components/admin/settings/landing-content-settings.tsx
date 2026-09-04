"use client";

import { Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Surface } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toast";
import type { LandingContent } from "@/lib/landing-content";
import { updateLandingContentAction } from "@/server/landing";

type TextKey = Exclude<keyof LandingContent, "moments">;
type Field = { key: TextKey; label: string; multiline?: boolean };
type ContentPanel =
  "navigation" | "hero" | "program" | "practical" | "message" | "moments";

const groups: Array<{
  id: Exclude<ContentPanel, "moments">;
  title: string;
  description: string;
  fields: Field[];
}> = [
  {
    id: "navigation",
    title: "Navigation et chargement",
    description: "Libellés visibles avant l’arrivée sur la page.",
    fields: [
      { key: "monogram", label: "Monogramme" },
      { key: "navMessage", label: "Lien du message" },
      { key: "navProgram", label: "Lien du programme" },
      { key: "navInfo", label: "Lien des informations" },
      { key: "navGallery", label: "Lien de la galerie" },
      { key: "accessLabel", label: "Bouton d’accès invité" },
      { key: "loaderName", label: "Nom dans le loader" },
      { key: "loaderMessage", label: "Message du loader" },
      { key: "loaderDate", label: "Date du loader" },
    ],
  },
  {
    id: "hero",
    title: "Hero",
    description: "Le premier message vu par les invités.",
    fields: [
      { key: "heroEyebrow", label: "Sur-titre" },
      { key: "heroFirstName", label: "Premier prénom" },
      { key: "heroSecondName", label: "Second prénom" },
      { key: "heroDate", label: "Date affichée" },
      { key: "heroDescription", label: "Texte d’invitation", multiline: true },
      { key: "heroCta", label: "Bouton du hero" },
    ],
  },
  {
    id: "program",
    title: "Compte à rebours et programme",
    description: "Les textes qui annoncent et introduisent le déroulé du mariage.",
    fields: [
      { key: "countdownEyebrow", label: "Sur-titre du compte à rebours" },
      { key: "countdownTitle", label: "Titre du compte à rebours", multiline: true },
      { key: "countdownNote", label: "Note sous le compte à rebours", multiline: true },
      { key: "countdownDays", label: "Libellé des jours" },
      { key: "countdownHours", label: "Libellé des heures" },
      { key: "countdownMinutes", label: "Libellé des minutes" },
      { key: "countdownSeconds", label: "Libellé des secondes" },
      { key: "programDate", label: "Date du programme" },
      { key: "programTitle", label: "Première ligne du titre" },
      { key: "programAccent", label: "Seconde ligne du titre" },
      {
        key: "programDescription",
        label: "Introduction du programme",
        multiline: true,
      },
    ],
  },
  {
    id: "practical",
    title: "Informations pratiques",
    description: "Les titres et le message relatif au billet invité.",
    fields: [
      { key: "infoEyebrow", label: "Sur-titre" },
      { key: "infoTitle", label: "Titre" },
      { key: "infoDescription", label: "Introduction", multiline: true },
      { key: "fridayLabel", label: "Libellé du vendredi" },
      { key: "fridayTitle", label: "Titre du vendredi" },
      { key: "saturdayLabel", label: "Libellé du samedi" },
      { key: "saturdayTitle", label: "Titre du samedi" },
      { key: "ticketLabel", label: "Libellé du billet" },
      { key: "ticketTitle", label: "Titre du billet" },
      { key: "ticketDescription", label: "Description du billet", multiline: true },
      { key: "ticketCta", label: "Bouton du billet" },
    ],
  },
  {
    id: "message",
    title: "Message de clôture",
    description: "Le dernier message et la signature des mariés.",
    fields: [
      { key: "messageEyebrow", label: "Sur-titre" },
      { key: "messageTitle", label: "Première ligne du titre" },
      { key: "messageAccent", label: "Seconde ligne du titre" },
      { key: "messageDescription", label: "Message", multiline: true },
      { key: "signature", label: "Signature" },
      { key: "footerText", label: "Texte du footer" },
    ],
  },
];

export function LandingContentSettings({
  initialContent,
}: {
  initialContent: LandingContent;
}) {
  const { toast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [activePanel, setActivePanel] = useState<ContentPanel>("navigation");
  const [pending, startTransition] = useTransition();
  const update = (key: TextKey, value: string) =>
    setContent((current) => ({ ...current, [key]: value }));
  const updateMoment = (
    index: number,
    key: keyof LandingContent["moments"][number],
    value: string,
  ) =>
    setContent((current) => ({
      ...current,
      moments: current.moments.map((moment, momentIndex) =>
        momentIndex === index ? { ...moment, [key]: value } : moment,
      ),
    }));
  const addMoment = () =>
    setContent((current) => ({
      ...current,
      moments: [
        ...current.moments,
        {
          time: "00h00",
          day: "Jour à définir",
          title: "Nouvelle étape",
          text: "Ajoutez la description de ce moment.",
        },
      ],
    }));
  const removeMoment = (index: number) =>
    setContent((current) => ({
      ...current,
      moments: current.moments.filter((_, momentIndex) => momentIndex !== index),
    }));
  const save = () =>
    startTransition(async () => {
      const result = await updateLandingContentAction(content);
      if (result.error)
        toast({
          title: "Enregistrement impossible",
          description: result.error,
          variant: "error",
        });
      else
        toast({
          title: "Page d’accueil enregistrée",
          description: "Les textes publics ont été mis à jour.",
          variant: "success",
        });
    });

  return (
    <div className="space-y-5">
      <Surface className="p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 size-4 text-primary" />
          <div>
            <h2 className="font-semibold text-text">Contenu de la page d’accueil</h2>
            <p className="mt-1 text-sm text-text-muted">
              Tous les textes publics sont modifiables ici. Les photos, les animations
              et la mise en page restent protégées.
            </p>
          </div>
        </div>
      </Surface>
      <div
        className="flex gap-2 overflow-x-auto border-b border-border pb-3"
        role="tablist"
        aria-label="Sections de la page d’accueil"
      >
        {[...groups, { id: "moments" as const, title: "Étapes" }].map((panel) => (
          <button
            key={panel.id}
            type="button"
            role="tab"
            aria-selected={activePanel === panel.id}
            onClick={() => setActivePanel(panel.id)}
            className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition duration-200 ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 active:translate-y-0 ${
              activePanel === panel.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface-subtle text-text-muted hover:bg-primary-subtle hover:text-text"
            }`}
          >
            {panel.title}
          </button>
        ))}
      </div>
      <div key={activePanel} className="animate-settings-panel">
        {groups
          .filter((group) => group.id === activePanel)
          .map((group) => (
            <Surface key={group.title} className="p-4 shadow-sm sm:p-5">
              <h3 className="font-semibold text-text">{group.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{group.description}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <TextField
                    key={field.key}
                    field={field}
                    value={content[field.key]}
                    onChange={(value) => update(field.key, value)}
                  />
                ))}
              </div>
            </Surface>
          ))}
        {activePanel === "moments" && (
          <Surface className="p-4 shadow-sm sm:p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h3 className="font-semibold text-text">Étapes du programme</h3>
                <p className="mt-1 text-sm text-text-muted">
                  Ajoutez, retirez ou modifiez les horaires, jours, titres et
                  descriptions affichés dans la frise.
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={addMoment}
                disabled={content.moments.length >= 20}
                icon={<Plus className="size-4" />}
              >
                Ajouter une étape
              </Button>
            </div>
            <div className="mt-5 space-y-5">
              {content.moments.map((moment, index) => (
                <div
                  key={index}
                  className="border-t border-border pt-5 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-text">Étape {index + 1}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeMoment(index)}
                      disabled={content.moments.length <= 1}
                      className="text-danger hover:bg-danger-subtle hover:text-danger"
                      icon={<Trash2 className="size-4" />}
                    >
                      Supprimer
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <MomentField
                      label="Heure"
                      value={moment.time}
                      onChange={(value) => updateMoment(index, "time", value)}
                    />
                    <MomentField
                      label="Jour"
                      value={moment.day}
                      onChange={(value) => updateMoment(index, "day", value)}
                    />
                    <MomentField
                      label="Titre"
                      value={moment.title}
                      onChange={(value) => updateMoment(index, "title", value)}
                    />
                    <MomentField
                      label="Description"
                      value={moment.text}
                      multiline
                      onChange={(value) => updateMoment(index, "text", value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        )}
      </div>
      <div className="flex justify-end border-t border-border pt-4">
        <Button loading={pending} onClick={save} icon={<Save className="size-4" />}>
          Enregistrer la page d’accueil
        </Button>
      </div>
    </div>
  );
}

function TextField({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <MomentField
      label={field.label}
      value={value}
      multiline={field.multiline}
      onChange={onChange}
    />
  );
}
function MomentField({
  label,
  value,
  multiline,
  onChange,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  const id = `landing-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-focus focus:ring-2 focus:ring-focus/20"
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1.5"
        />
      )}
    </div>
  );
}
