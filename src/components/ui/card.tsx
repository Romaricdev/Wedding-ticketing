import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle";
}

export function Card({
  className,
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-sm border border-border shadow-[0_1px_2px_rgb(29_29_31_/_5%)] transition-[border-color,box-shadow,background-color,transform] duration-200 ease-out",
        variant === "default" ? "bg-surface" : "bg-surface-subtle",
        className,
      )}
      {...props}
    />
  );
}
