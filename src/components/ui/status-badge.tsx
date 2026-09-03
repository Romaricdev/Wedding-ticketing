import { type HTMLAttributes } from "react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusBadgeKind =
  | "active"
  | "used"
  | "revoked"
  | "cancelled"
  | "single"
  | "couple"
  | "success"
  | "warning"
  | "danger"
  | "info";

const STATUS_CONFIG: Record<
  StatusBadgeKind,
  { label: string; variant: BadgeVariant }
> = {
  active: { label: "Actif", variant: "success" },
  used: { label: "Utilisé", variant: "warning" },
  revoked: { label: "Révoqué", variant: "danger" },
  cancelled: { label: "Annulé", variant: "danger" },
  single: { label: "Single - 1 personne", variant: "neutral" },
  couple: { label: "Couple - 2 personnes", variant: "neutral" },
  success: { label: "Succès", variant: "success" },
  warning: { label: "Attention", variant: "warning" },
  danger: { label: "Erreur", variant: "danger" },
  info: { label: "Information", variant: "info" },
};

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: StatusBadgeKind;
  label?: string;
}

export function StatusBadge({
  status,
  label,
  className,
  ...props
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant={config.variant}
      className={cn("gap-1", className)}
      {...props}
    >
      <span aria-hidden="true">●</span>
      {label ?? config.label}
    </Badge>
  );
}
