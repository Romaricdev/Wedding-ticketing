import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle" | "elevated";
}

export function Surface({
  className,
  variant = "default",
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-sm border border-border transition-[border-color,box-shadow,background-color] duration-200 ease-out",
        variant === "default" && "bg-surface",
        variant === "subtle" && "bg-surface-subtle",
        variant === "elevated" && "bg-surface shadow-overlay",
        className,
      )}
      {...props}
    />
  );
}
