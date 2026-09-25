import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { NodeStatus } from "@/types/database.types";

const ORDER: NodeStatus[] = ["normal", "warning", "alert", "offline"];

export function MapLegend() {
  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-[1000] flex gap-3 rounded border border-canopy-600 bg-canopy-900/90 px-3 py-2 backdrop-blur">
      {ORDER.map((status) => (
        <div key={status} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[status] }}
          />
          <span className="font-mono text-[10px] uppercase tracking-wide text-canopy-300">
            {STATUS_LABELS[status]}
          </span>
        </div>
      ))}
    </div>
  );
}
