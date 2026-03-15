import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
import { TrendIndicator } from "./trend-indicator";

export interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { direction: "up" | "down"; percentage: number; isGood?: boolean };
  variant?: "default" | "highlighted" | "alert-past" | "alert-trending";
  loading?: boolean;
  className?: string;
}

const variantStyles = {
  default: "bg-card border border-card-border",
  highlighted: "bg-chartreuse border border-chartreuse",
  "alert-past": "bg-alert-past-target border border-card-border",
  "alert-trending": "bg-alert-trending border border-card-border",
} as const;

export function KPICard({
  icon: Icon,
  label,
  value,
  trend,
  variant = "default",
  loading = false,
  className,
}: KPICardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-card p-4 shadow-sm bg-card border border-card-border",
          className
        )}
      >
        <Skeleton className="w-10 h-10 mb-3" />
        <Skeleton className="w-24 h-8 mb-2" />
        <Skeleton className="w-16 h-4" />
      </div>
    );
  }

  const isHighlighted = variant === "highlighted";

  return (
    <div
      className={cn(
        "rounded-card p-4 shadow-sm",
        variantStyles[variant],
        className
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-badge flex items-center justify-center mb-3",
        isHighlighted ? "bg-forest" : "bg-forest"
      )}>
        <Icon size={20} className="text-white" />
      </div>
      <p className={cn(
        "text-sm mb-1",
        isHighlighted ? "text-forest/70" : "text-text-secondary"
      )}>{label}</p>
      <p className={cn(
        "text-3xl font-heading font-bold tabular-nums",
        isHighlighted ? "text-forest" : "text-text-primary"
      )}>{value}</p>
      {trend && (
        <TrendIndicator
          direction={trend.direction}
          percentage={trend.percentage}
          isGood={trend.isGood}
        />
      )}
    </div>
  );
}
