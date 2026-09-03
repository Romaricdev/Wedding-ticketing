"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { CheckCircle2, CircleAlert, History, Keyboard, Play, RefreshCw, ScanLine, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import { Pagination } from "@/components/ui/pagination";
import { findTicketForManualCheckInAction, listCheckInAttemptsAction, manualCheckInAction, scanTicketAction } from "@/server/check-in/actions";
import type { CheckInAttemptRecord, CheckInResponse, CheckInTicketSummary } from "@/types/check-in";
import { cn } from "@/lib/utils";

export function ScanClient({ canManual, initialAttempts }: { canManual: boolean; initialAttempts: CheckInAttemptRecord[] }) {
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<{ stop: () => void } | null>(null);
  const reader = useRef<BrowserQRCodeReader | null>(null);
  const reading = useRef(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>();
  const [online, setOnline] = useState(true);
  const [result, setResult] = useState<CheckInResponse | null>(null);
  const [checking, startChecking] = useTransition();
  const [manualCode, setManualCode] = useState("");
  const [manualTicket, setManualTicket] = useState<CheckInTicketSummary | null>(null);
  const [manualError, setManualError] = useState<string>();
  const [manualBusy, startManual] = useTransition();
  const [attempts, setAttempts] = useState(initialAttempts);
  const [historyPage, setHistoryPage] = useState(1);

  const stopCamera = () => { controls.current?.stop(); controls.current = null; setCameraActive(false); };
  useEffect(() => {
    const refresh = () => setOnline(navigator.onLine);
    refresh(); window.addEventListener("online", refresh); window.addEventListener("offline", refresh);
    return () => { window.removeEventListener("online", refresh); window.removeEventListener("offline", refresh); stopCamera(); };
  }, []);
  const refreshAttempts = async () => {
    const history = await listCheckInAttemptsAction();
    if (history.attempts) { setAttempts(history.attempts); setHistoryPage(1); }
  };

  const submitToken = (token: string) => startChecking(async () => {
    const response = await scanTicketAction(token, navigator.userAgent.slice(0, 120));
    setResult(response);
    await refreshAttempts();
    if (response.accepted) navigator.vibrate?.(120);
    else navigator.vibrate?.([80, 60, 80]);
  });

  const startCamera = async () => {
    if (!online) { setCameraError("Aucune connexion Internet : le serveur ne peut pas vérifier un billet."); return; }
    setCameraError(undefined); setResult(null); reading.current = false;
    try {
      reader.current ??= new BrowserQRCodeReader();
      controls.current = await reader.current.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } }, audio: false }, video.current ?? undefined, (scan) => {
        if (!scan || reading.current) return;
        reading.current = true; stopCamera(); submitToken(scan.getText());
      });
      setCameraActive(true);
    } catch {
      setCameraError("Impossible d’accéder à la caméra. Autorisez la caméra puis réessayez.");
      stopCamera();
    }
  };

  const findManual = () => startManual(async () => {
    setManualError(undefined); setManualTicket(null);
    const value = manualCode.trim();
    if (!value) { setManualError("Saisissez le code du billet."); return; }
    const lookup = await findTicketForManualCheckInAction(value);
    if (lookup.error) { setManualError(lookup.error); return; }
    if (!lookup.ticket) { setManualError("Aucun billet ne correspond à ce code."); return; }
    setManualTicket(lookup.ticket);
  });

  const confirmManual = () => {
    if (!manualTicket) return;
    startManual(async () => {
      const response = await manualCheckInAction(manualTicket.id, "Validation manuelle");
      setResult(response); setManualTicket(null); setManualCode(""); await refreshAttempts();
    });
  };

  return <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-5">
    {!online ? <div role="alert" className="flex items-center gap-2 border border-danger/30 bg-danger-subtle p-3 text-sm text-danger"><CircleAlert className="size-4 shrink-0" aria-hidden="true" />Pas de connexion Internet : aucun billet ne peut être validé.</div> : null}
    <Surface className="overflow-hidden shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5"><div><h1 className="text-xl font-semibold text-text sm:text-2xl">Contrôle des entrées</h1><p className="mt-0.5 text-sm text-text-muted">Scannez un QR code pour vérifier le billet en temps réel.</p></div><span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", online ? "text-success" : "text-danger")}><span className="size-2 rounded-full bg-current" />{online ? "En ligne" : "Hors ligne"}</span></div>
      <div className="p-4 sm:p-5">
        <div className="relative overflow-hidden border border-border bg-black" style={{ aspectRatio: "16 / 10" }}>
          <video ref={video} className="h-full w-full object-cover" muted playsInline />
          {!cameraActive ? <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-subtle p-6 text-center"><span className="flex size-16 items-center justify-center rounded-sm border border-border bg-surface text-primary"><ScanLine className="size-8" aria-hidden="true" /></span><p className="mt-4 font-semibold text-text">Caméra prête</p><p className="mt-1 max-w-sm text-sm text-text-muted">Placez le QR code au centre de l’objectif. Le scan s’arrête dès qu’un code est détecté.</p></div> : <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="h-40 w-40 border-2 border-white/90 shadow-overlay sm:h-52 sm:w-52" /></div>}
        </div>
        {cameraError ? <p className="mt-3 text-sm text-danger">{cameraError}</p> : null}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row"><Button className="sm:flex-1" loading={checking} disabled={!online || checking || cameraActive} onClick={() => void startCamera()} icon={<Play className="size-4" aria-hidden="true" />}>Démarrer le scanner</Button>{cameraActive ? <Button variant="secondary" onClick={stopCamera}>Arrêter</Button> : null}<Button variant="secondary" onClick={() => { stopCamera(); setResult(null); }} icon={<RefreshCw className="size-4" aria-hidden="true" />}>Nouveau scan</Button></div>
      </div>
    </Surface>
    {checking ? <Surface className="p-5 text-center text-sm text-text-muted">Vérification sécurisée du billet…</Surface> : null}
    {result ? <ScanResult response={result} /> : null}
    {canManual ? <Surface className="p-4 shadow-sm sm:p-5"><div className="flex items-start gap-2"><Keyboard className="mt-0.5 size-4 text-text-muted" aria-hidden="true" /><div><h2 className="font-semibold text-text">Validation manuelle</h2><p className="mt-1 text-sm text-text-muted">Réservée à l’administrateur lorsque le QR ne peut pas être lu.</p></div></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><Input value={manualCode} onChange={(event) => setManualCode(event.target.value.toUpperCase())} placeholder="Code du billet, ex. ABC123" aria-label="Code du billet" /><Button variant="secondary" loading={manualBusy} onClick={findManual}>Rechercher</Button></div>{manualError ? <p className="mt-2 text-sm text-danger">{manualError}</p> : null}{manualTicket ? <div className="mt-4 border border-border bg-surface-subtle p-3"><TicketIdentity ticket={manualTicket} /><Button className="mt-3 w-full" loading={manualBusy} onClick={confirmManual}>Confirmer l’entrée manuelle</Button></div> : null}</Surface> : null}
    <CheckInHistory attempts={attempts} page={historyPage} onPageChange={setHistoryPage} onRefresh={() => void refreshAttempts()} />
  </div>;
}

function ScanResult({ response }: { response: CheckInResponse }) {
  const accepted = response.accepted;
  const Icon = accepted ? CheckCircle2 : XCircle;
  return <Surface className={cn("border-l-4 p-3 shadow-sm sm:p-5", accepted ? "border-l-success" : "border-l-danger")}><div className="flex items-start gap-2.5 sm:gap-3"><Icon className={cn("mt-0.5 size-5 shrink-0 sm:size-6", accepted ? "text-success" : "text-danger")} aria-hidden="true" /><div className="min-w-0 flex-1"><h2 className="text-base font-semibold text-text sm:text-lg">{response.title}</h2><p className="mt-0.5 text-sm text-text-muted sm:mt-1">{response.message}</p>{response.ticket ? <div className="mt-3 border-t border-border pt-3 sm:mt-4 sm:pt-4"><TicketIdentity ticket={response.ticket} /></div> : null}</div></div></Surface>;
}

function TicketIdentity({ ticket }: { ticket: CheckInTicketSummary }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3"><div className="col-span-2 sm:col-span-1"><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Invité{ticket.guests.length > 1 ? "s" : ""}</p><p className="mt-0.5 font-medium text-text sm:mt-1">{ticket.guests.map((guest) => `${guest.lastName} ${guest.firstNames}`).join(" · ")}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Table</p><p className="mt-0.5 font-medium text-text sm:mt-1">{ticket.tableLabel}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Billet</p><p className="mt-0.5 font-medium text-text sm:mt-1">{ticket.type === "COUPLE" ? "Couple" : "Single"} · {ticket.shortCode}</p></div></div>;
}

const resultLabels: Record<CheckInAttemptRecord["result"], string> = {
  ACCEPTED: "Entrée validée", MANUAL_ACCEPTED: "Entrée validée manuellement", ALREADY_USED: "Billet déjà utilisé", CANCELLED: "Billet annulé", REVOKED: "Billet révoqué", INVALID: "QR invalide", DENIED: "Validation refusée",
};

function CheckInHistory({ attempts, page, onPageChange, onRefresh }: { attempts: CheckInAttemptRecord[]; page: number; onPageChange: (page: number) => void; onRefresh: () => void }) {
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(attempts.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleAttempts = attempts.slice((safePage - 1) * pageSize, safePage * pageSize);
  return <Surface className="overflow-hidden shadow-sm"><div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5"><div className="flex items-start gap-2"><History className="mt-0.5 size-4 text-primary" aria-hidden="true" /><div><h2 className="font-semibold text-text">Billets contrôlés</h2><p className="mt-0.5 text-sm text-text-muted">{attempts.length} contrôle{attempts.length > 1 ? "s" : ""} enregistré{attempts.length > 1 ? "s" : ""} pour cet événement.</p></div></div><Button variant="ghost" size="sm" onClick={onRefresh} icon={<RefreshCw className="size-4" aria-hidden="true" />}>Actualiser</Button></div>{attempts.length === 0 ? <div className="p-6 text-center text-sm text-text-muted">Aucun billet n’a encore été contrôlé.</div> : <><div className="divide-y divide-border">{visibleAttempts.map((attempt) => <CheckInHistoryRow key={attempt.id} attempt={attempt} />)}</div><div className="px-4 pb-3 sm:px-5"><Pagination page={safePage} totalItems={attempts.length} pageSize={pageSize} onPageChange={onPageChange} itemLabel="contrôles" /></div></>}</Surface>;
}

function CheckInHistoryRow({ attempt }: { attempt: CheckInAttemptRecord }) {
  const accepted = attempt.result === "ACCEPTED" || attempt.result === "MANUAL_ACCEPTED";
  const guests = attempt.ticket?.guests.map((guest) => `${guest.lastName} ${guest.firstNames}`).join(" · ");
  return <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="min-w-0"><p className="truncate font-medium text-text">{attempt.ticket ? guests : "QR code non reconnu"}</p><p className="mt-0.5 text-sm text-text-muted">{attempt.ticket ? `${attempt.ticket.shortCode} · Table ${attempt.ticket.tableLabel}` : "Aucun billet associé"}</p></div><div className="flex shrink-0 items-center gap-3 sm:text-right"><div><p className={cn("text-sm font-medium", accepted ? "text-success" : "text-danger")}>{resultLabels[attempt.result]}</p><p className="mt-0.5 text-xs text-text-muted">{new Date(attempt.scannedAt).toLocaleString("fr-FR")}{attempt.isManual ? " · Manuel" : ""}</p></div></div></div>;
}
