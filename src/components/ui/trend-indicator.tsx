import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrendIndicatorProps {
  direction: "up" | "down";
  percentage: number;
  className?: string;
}

export function TrendIndicator({
  direction,
  percentage,
  className,
}: TrendIndicatorProps) {
  const Icon = direction === "up" ? TrendingUp : TrendingDown;
  const colorClass = direction === "up" ? "text-positive" : "text-negative";

  return (
    <span className={cn("flex items-center gap-1 text-sm mt-1", colorClass, className)}>
      <Icon size={14} />
      <span className="tabular-nums font-medium">
        {percentage.toFixed(1)}%
      </span>
    </span>
  );
}
