import { cn } from "@/lib/utils";

export type Status =
  | "completed"
  | "ready"
  | "attention"
  | "blocked"
  | "in-progress";

const statusStyles: Record<Status, string> = {
  completed: "bg-status-ready text-white",
  ready: "bg-status-ready text-white",
  attention: "bg-status-attention text-white",
  blocked: "bg-status-blocked text-text-primary",
  "in-progress": "bg-status-progress text-white",
};

const statusLabels: Record<Status, string> = {
  completed: "Completed",
  ready: "Ready",
  attention: "NEEDS ATTENTION",
  blocked: "Blocked",
  "in-progress": "In Progress",
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  status: Status;
  label?: string;
}

export function StatusBadge({
  status,
  label,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex px-3 py-1 text-xs font-semibold rounded-pill",
        statusStyles[status],
        className
      )}
      {...props}
    >
      {label ?? statusLabels[status]}
    </span>
  );
}
