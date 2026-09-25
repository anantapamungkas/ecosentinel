import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { NodeStatus } from "@/types/database.types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: NodeStatus;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({ status, pulse = false, className }: StatusBadgeProps) {
  const color = STATUS_COLORS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide",
        className
      )}
      style={{ borderColor: `${color}55`, color, backgroundColor: `${color}14` }}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      </span>
      {STATUS_LABELS[status]}
    </span>
  );
}
