import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrendIndicatorProps {
  direction: "up" | "down";
  percentage: number;
  isGood?: boolean;
  className?: string;
}

export function TrendIndicator({
  direction,
  percentage,
  isGood = true,
  className,
}: TrendIndicatorProps) {
  const Icon = direction === "up" ? TrendingUp : TrendingDown;
  const isPositive = isGood ? direction === "up" : direction === "down";
  const colorClass = isPositive ? "text-positive" : "text-negative";

  return (
    <span className={cn("flex items-center gap-1 text-sm mt-1", colorClass, className)}>
      <Icon size={14} />
      <span className="tabular-nums font-medium">
        {percentage.toFixed(1)}%
      </span>
    </span>
  );
}
