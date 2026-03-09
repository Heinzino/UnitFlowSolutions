import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "flush";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-card rounded-card shadow-sm border border-card-border",
          variant === "default" && "p-6",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
