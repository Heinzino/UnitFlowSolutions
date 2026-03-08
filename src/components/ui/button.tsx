import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-emerald text-white hover:bg-emerald-dark",
  secondary:
    "bg-card text-text-primary border border-gray-200 hover:bg-gray-50",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/10",
  cta: "bg-chartreuse text-forest font-bold hover:brightness-95",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-heading font-semibold transition-colors rounded-pill",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
