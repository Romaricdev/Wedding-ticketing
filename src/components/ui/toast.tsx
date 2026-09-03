"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: Omit<ToastMessage, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-success/20 bg-success-subtle text-success",
  error: "border-danger/20 bg-danger-subtle text-danger",
  info: "border-info/20 bg-surface text-info",
  warning: "border-warning/20 bg-warning-subtle text-warning",
};

const variantIcons: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
};

function ToastItem({
  message,
  onDismiss,
}: {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const variant = message.variant ?? "info";
  const Icon = variantIcons[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border p-4 shadow-md",
        variantStyles[variant],
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text">{message.title}</p>
        {message.description ? (
          <p className="mt-1 text-sm text-text-muted">{message.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        className="rounded-md p-1 text-text-muted hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        aria-label="Fermer la notification"
        onClick={() => onDismiss(message.id)}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const toast = useCallback(
    (message: Omit<ToastMessage, "id">) => {
      const id = crypto.randomUUID();
      const duration = message.duration ?? 5000;

      setMessages((current) => [...current, { ...message, id }]);

      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {messages.map((message) => (
          <ToastItem key={message.id} message={message} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast doit être utilisé dans un ToastProvider.");
  }

  return context;
}
