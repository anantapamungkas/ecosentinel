import type { MapNode, NodeStatus } from "@/types/database.types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

interface StatsBarProps {
  nodes: MapNode[];
}

const ORDER: NodeStatus[] = ["normal", "warning", "alert", "offline"];

export function StatsBar({ nodes }: StatsBarProps) {
  const counts = ORDER.reduce<Record<NodeStatus, number>>(
    (acc, status) => {
      acc[status] = nodes.filter((node) => node.status === status).length;
      return acc;
    },
    { normal: 0, warning: 0, alert: 0, offline: 0 }
  );

  return (
    <div className="grid grid-cols-4 gap-2 border-b border-canopy-600 bg-canopy-900 px-4 py-3">
      {ORDER.map((status) => (
        <div
          key={status}
          className="flex flex-col items-center gap-0.5 rounded border border-canopy-600 bg-canopy-800/50 py-2"
        >
          <span className="font-mono text-lg font-semibold" style={{ color: STATUS_COLORS[status] }}>
            {counts[status]}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-canopy-400">
            {STATUS_LABELS[status]}
          </span>
        </div>
      ))}
    </div>
  );
}
