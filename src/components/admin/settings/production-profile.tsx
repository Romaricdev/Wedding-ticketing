"use client";

import { useState, useTransition } from "react";
import { Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Surface } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toast";
import { updateProductionProfileAction } from "@/server/event-settings/actions";

export function ProductionProfile({ eventName, venueName, weddingDate, displayName }: { eventName: string; venueName: string | null; weddingDate: Date | null; displayName: string }) {
  const { toast } = useToast(); const [pending, startTransition] = useTransition(); const [values, setValues] = useState({ eventName, venueName: venueName ?? "", weddingDate: weddingDate ? weddingDate.toISOString().slice(0, 10) : "", displayName });
  const save = () => startTransition(async () => { const form = new FormData(); Object.entries(values).forEach(([key, value]) => form.set(key, value)); const result = await updateProductionProfileAction(form); if (result.error) toast({ title: "Enregistrement impossible", description: result.error, variant: "error" }); else toast({ title: "Configuration enregistrée", description: "Les libellés de production sont mis à jour.", variant: "success" }); });
  return <Surface className="p-4 shadow-sm sm:p-5"><div className="flex items-start gap-2"><Settings2 className="mt-0.5 size-4 text-primary" /><div><h2 className="font-semibold text-text">Informations de production</h2><p className="mt-1 text-sm text-text-muted">Remplacez les valeurs de démonstration affichées dans la navigation et l’en-tête.</p></div></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Nom de l’événement" value={values.eventName} onChange={(eventName) => setValues((current) => ({ ...current, eventName }))} /><Field label="Nom affiché de l’administrateur" value={values.displayName} onChange={(displayName) => setValues((current) => ({ ...current, displayName }))} /><Field label="Lieu de réception" value={values.venueName} onChange={(venueName) => setValues((current) => ({ ...current, venueName }))} /><Field label="Date du mariage" type="date" value={values.weddingDate} onChange={(weddingDate) => setValues((current) => ({ ...current, weddingDate }))} /></div><Button className="mt-5" loading={pending} onClick={save} icon={<Save className="size-4" />}>Enregistrer les informations</Button></Surface>;
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: "text" | "date" }) { const id = label.toLowerCase().replaceAll(" ", "-"); return <div><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5" /></div>; }
