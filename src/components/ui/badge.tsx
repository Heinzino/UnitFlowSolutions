import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-gray-100 text-text-primary",
  emerald: "bg-emerald/10 text-emerald-dark",
  outline: "border border-gray-200 text-text-secondary",
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium rounded-badge px-2.5 py-0.5",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
