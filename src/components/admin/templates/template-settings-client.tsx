"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { FileText, FileUp, Move, QrCode, Save, ShieldCheck } from "lucide-react";

import { updateTicketTemplateLayoutAction, uploadTicketTemplateAction } from "@/server/templates/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { TicketTemplateRecord } from "@/types/templates";

type Layout = Pick<TicketTemplateRecord, "pageNumber" | "qrX" | "qrY" | "qrSize">;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function normalizeLayout(template: TicketTemplateRecord | null): Layout {
  if (!template) return { pageNumber: 1, qrX: 450, qrY: 358, qrSize: 88 };
  const size = clamp(template.qrSize, 70, Math.min(template.pageWidth, template.pageHeight));
  return {
    pageNumber: template.pageNumber,
    qrSize: size,
    qrX: clamp(template.qrX, 0, template.pageWidth - size),
    qrY: clamp(template.qrY, 0, template.pageHeight - size),
  };
}

function layoutFormData(layout: Layout): FormData {
  const data = new FormData();
  data.set("pageNumber", String(layout.pageNumber));
  data.set("qrX", String(Math.round(layout.qrX * 100) / 100));
  data.set("qrY", String(Math.round(layout.qrY * 100) / 100));
  data.set("qrSize", String(Math.round(layout.qrSize * 100) / 100));
  return data;
}

export function TemplateSettingsClient({ initialTemplate }: { initialTemplate: TicketTemplateRecord | null }) {
  const { toast } = useToast();
  const [template, setTemplate] = useState(initialTemplate);
  const [layout, setLayout] = useState<Layout>(() => normalizeLayout(initialTemplate));
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, startUpload] = useTransition();
  const [isSaving, startSave] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const applyTemplate = (next: TicketTemplateRecord, description: string) => {
    setTemplate(next);
    setLayout(normalizeLayout(next));
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
    toast({ title: "Template enregistré", description, variant: "success" });
  };

  const upload = () => {
    if (!file) {
      toast({ title: "Fichier requis", description: "Sélectionnez le PDF de l'invitation.", variant: "warning" });
      return;
    }
    startUpload(async () => {
      const data = layoutFormData(layout);
      data.set("file", file);
      const result = await uploadTicketTemplateAction(data);
      if (!result.template) {
        toast({ title: "Import impossible", description: result.error ?? "Réessayez dans quelques instants.", variant: "error" });
        return;
      }
      applyTemplate(result.template, "Les prochains billets utiliseront ce modèle.");
    });
  };

  const savePlacement = () => {
    if (!template) return;
    startSave(async () => {
      const result = await updateTicketTemplateLayoutAction(layoutFormData(layout));
      if (!result.template) {
        toast({ title: "Enregistrement impossible", description: result.error ?? "Réessayez dans quelques instants.", variant: "error" });
        return;
      }
      applyTemplate(result.template, "La position du QR est enregistrée pour les prochains billets.");
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Modèle d’invitation" description="Importez le PDF source et placez visuellement la zone réservée au QR code." />
      <Surface className="overflow-hidden shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border bg-surface-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-sm bg-primary/10 text-primary"><FileText className="size-4" aria-hidden="true" /></span><div><p className="font-semibold text-text">{template?.originalFilename ?? "Aucun modèle actif"}</p><p className="text-sm text-text-muted">PDF privé, conservé dans le stockage sécurisé de l’événement.</p></div></div>
          {template ? <span className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-success"><ShieldCheck className="size-4" aria-hidden="true" /> Modèle actif</span> : null}
        </div>
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="bg-surface-subtle p-4 sm:p-6">
            {template?.previewUrl ? <QrPlacementCanvas template={template} layout={layout} onChange={setLayout} /> : <EmptyPreview />}
          </div>
          <aside className="border-t border-border bg-surface p-4 sm:p-5 lg:border-l lg:border-t-0">
            <h2 className="font-semibold text-text">Remplacer le modèle</h2><p className="mt-1 text-sm text-text-muted">Les PDF déjà générés ne sont jamais modifiés.</p>
            <div className="mt-4"><Label htmlFor="template-file">Fichier PDF</Label><Input ref={fileInput} id="template-file" className="mt-1.5 cursor-pointer file:mr-3 file:border-0 file:bg-surface-subtle file:px-2 file:py-1 file:text-sm file:font-medium file:text-text" type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><p className="mt-1.5 text-xs text-text-muted">PDF uniquement · 20 Mo maximum.</p></div>
            <Button className="mt-4 w-full" variant="secondary" loading={isUploading} onClick={upload} icon={<FileUp className="size-4" aria-hidden="true" />}>{template ? "Remplacer le modèle" : "Importer le modèle"}</Button>
            <div className="my-6 border-t border-border" />
            <div className="flex items-start gap-2"><QrCode className="mt-0.5 size-4 text-primary" aria-hidden="true" /><div><h2 className="font-semibold text-text">Placement du QR code</h2><p className="mt-1 text-sm text-text-muted">Glissez le carré sur le modèle. Utilisez sa poignée pour modifier la taille.</p></div></div>
            {template ? <><div className="mt-4 grid grid-cols-3 gap-2"><Value label="X" value={layout.qrX} /><Value label="Y" value={layout.qrY} /><Value label="Taille" value={layout.qrSize} suffix=" pt" /></div><p className="mt-3 rounded-sm border border-primary/20 bg-primary/5 p-3 text-xs leading-5 text-text-muted">Les coordonnées PDF sont calculées automatiquement et ne peuvent pas sortir de la page.</p><Button className="mt-4 w-full" loading={isSaving} onClick={savePlacement} icon={<Save className="size-4" aria-hidden="true" />}>Enregistrer la position QR</Button></> : null}
          </aside>
        </div>
      </Surface>
    </div>
  );
}

function EmptyPreview() {
  return <div className="flex min-h-[420px] flex-col items-center justify-center border border-dashed border-border bg-surface p-6 text-center"><span className="flex size-12 items-center justify-center rounded-sm bg-primary/10 text-primary"><FileUp className="size-6" aria-hidden="true" /></span><p className="mt-4 font-semibold text-text">Importez le PDF de l’invitation</p><p className="mt-1 max-w-sm text-sm text-text-muted">Le fichier reste intact : l’application ajoute uniquement le QR lors de la génération.</p></div>;
}

function Value({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return <div className="rounded-sm border border-border bg-surface-subtle px-2 py-2 text-center"><p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</p><p className="mt-0.5 text-sm font-semibold tabular-nums text-text">{Math.round(value)}{suffix}</p></div>;
}

function QrPlacementCanvas({ template, layout, onChange }: { template: TicketTemplateRecord; layout: Layout; onChange: (next: Layout) => void }) {
  const canvas = useRef<HTMLDivElement>(null);
  const interaction = useRef<{ mode: "move" | "resize"; startX: number; startY: number; start: Layout } | null>(null);
  const { pageWidth: width, pageHeight: height } = template;
  const left = (layout.qrX / width) * 100;
  const bottom = (layout.qrY / height) * 100;
  const size = (layout.qrSize / width) * 100;

  const delta = (event: React.PointerEvent<HTMLDivElement>, start: { startX: number; startY: number }) => {
    const rect = canvas.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: ((event.clientX - start.startX) / rect.width) * width, y: ((start.startY - event.clientY) / rect.height) * height };
  };
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = interaction.current;
    if (!current) return;
    const change = delta(event, current);
    if (current.mode === "resize") {
      const qrSize = clamp(current.start.qrSize + change.x, 70, Math.min(width - current.start.qrX, height - current.start.qrY));
      onChange({ ...current.start, qrSize });
    } else {
      onChange({ ...current.start, qrX: clamp(current.start.qrX + change.x, 0, width - current.start.qrSize), qrY: clamp(current.start.qrY + change.y, 0, height - current.start.qrSize) });
    }
  };
  const begin = (event: React.PointerEvent<HTMLElement>, mode: "move" | "resize") => {
    event.stopPropagation();
    interaction.current = { mode, startX: event.clientX, startY: event.clientY, start: layout };
    canvas.current?.setPointerCapture(event.pointerId);
  };

  return <div ref={canvas} className="relative mx-auto w-full max-w-[780px] select-none overflow-hidden border border-border bg-surface shadow-overlay" style={{ aspectRatio: `${width} / ${height}` }} onPointerMove={move} onPointerUp={() => { interaction.current = null; }} onPointerCancel={() => { interaction.current = null; }}>
    <PdfCanvas src={template.previewUrl ?? ""} pageNumber={template.pageNumber} />
    <div className="absolute inset-0 cursor-crosshair" aria-label="Zone de placement du QR code">
      <div className={cn("absolute touch-none border-2 border-primary bg-white/90 shadow-overlay", "cursor-grab active:cursor-grabbing")} style={{ left: `${left}%`, bottom: `${bottom}%`, width: `${size}%`, aspectRatio: "1 / 1" }} onPointerDown={(event) => begin(event, "move")}>
        <div className="flex h-full flex-col items-center justify-center text-primary"><QrCode className="size-1/2" aria-hidden="true" /><span className="mt-1 text-[10px] font-bold tracking-wide">QR</span></div>
        <button type="button" aria-label="Redimensionner le QR" className="absolute -bottom-2 -right-2 flex size-5 cursor-nwse-resize items-center justify-center rounded-sm border-2 border-surface bg-primary text-white" onPointerDown={(event) => begin(event, "resize")}><Move className="size-3 rotate-90" aria-hidden="true" /></button>
      </div>
    </div>
    <div className="pointer-events-none absolute bottom-3 left-3 rounded-sm bg-text/85 px-2 py-1 text-xs font-medium text-white">Glisser pour déplacer · poignée pour redimensionner</div>
  </div>;
}

function PdfCanvas({ src, pageNumber }: { src: string; pageNumber: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let disposed = false;
    let destroyTask: (() => void) | undefined;

    const render = async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        const loadingTask = pdfjs.getDocument({ url: src, withCredentials: true });
        destroyTask = () => loadingTask.destroy();
        const document = await loadingTask.promise;
        const page = await document.getPage(pageNumber);
        const element = canvas.current;
        if (!element || disposed) return;
        const unitViewport = page.getViewport({ scale: 1 });
        const availableWidth = element.parentElement?.clientWidth ?? unitViewport.width;
        const scale = (availableWidth / unitViewport.width) * Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale });
        element.width = Math.floor(viewport.width);
        element.height = Math.floor(viewport.height);
        const context = element.getContext("2d");
        if (!context || disposed) return;
        await page.render({ canvas: element, canvasContext: context, viewport }).promise;
        if (!disposed) setError(false);
      } catch {
        if (!disposed) setError(true);
      }
    };

    void render();
    return () => {
      disposed = true;
      destroyTask?.();
    };
  }, [pageNumber, src]);

  if (error) {
    return <div className="absolute inset-0 flex items-center justify-center bg-surface p-6 text-center text-sm text-text-muted">L’aperçu ne peut pas être chargé pour le moment.</div>;
  }
  return <canvas ref={canvas} className="absolute inset-0 h-full w-full bg-white" aria-label="Aperçu du template PDF" />;
}
