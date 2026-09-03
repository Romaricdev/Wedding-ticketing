"use client";

import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type NetworkStatusKind = "online" | "offline" | "slow";

export interface NetworkStatusProps {
  className?: string;
  showLabel?: boolean;
}

export function NetworkStatus({
  className,
  showLabel = true,
}: NetworkStatusProps) {
  const [status, setStatus] = useState<NetworkStatusKind>("online");

  useEffect(() => {
    const updateStatus = () => {
      setStatus(navigator.onLine ? "online" : "offline");
    };

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  const config = {
    online: {
      label: "Connecté",
      icon: Wifi,
      className: "text-success",
    },
    offline: {
      label: "Hors ligne",
      icon: WifiOff,
      className: "text-danger",
    },
    slow: {
      label: "Connexion faible",
      icon: AlertTriangle,
      className: "text-warning",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn("size-4 shrink-0", config.className)} aria-hidden="true" />
      {showLabel ? (
        <span className="font-medium text-text">
          Réseau : <span className={config.className}>{config.label}</span>
        </span>
      ) : (
        <span className="sr-only">Réseau : {config.label}</span>
      )}
    </div>
  );
}
