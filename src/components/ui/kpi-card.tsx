import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
import { TrendIndicator } from "./trend-indicator";

export interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { direction: "up" | "down"; percentage: number };
  variant?: "default" | "alert-past" | "alert-trending";
  loading?: boolean;
  className?: string;
}

const variantStyles = {
  default: "bg-card",
  "alert-past": "bg-alert-past-target",
  "alert-trending": "bg-alert-trending",
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
          "rounded-card p-6 shadow-sm bg-card",
          className
        )}
      >
        <Skeleton className="w-10 h-10 mb-3" />
        <Skeleton className="w-24 h-8 mb-2" />
        <Skeleton className="w-16 h-4" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-card p-6 shadow-sm",
        variantStyles[variant],
        className
      )}
    >
      <div className="w-10 h-10 bg-forest rounded-badge flex items-center justify-center mb-3">
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-text-secondary text-sm mb-1">{label}</p>
      <p className="text-3xl font-heading font-bold tabular-nums">{value}</p>
      {trend && (
        <TrendIndicator
          direction={trend.direction}
          percentage={trend.percentage}
        />
      )}
    </div>
  );
}
