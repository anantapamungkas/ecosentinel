import { clamp, cn } from "@/lib/utils";

interface TelemetryGaugeProps {
  label: string;
  value: number;
  unit?: string;
  max: number;
  min?: number;
  color?: string;
  formatValue?: (value: number) => string;
}

/**
 * Horizontal arc-style gauge used for tilt, acoustic confidence, and impact
 * readings inside the node inspection drawer.
 */
export function TelemetryGauge({
  label,
  value,
  unit = "",
  max,
  min = 0,
  color = "#46A758",
  formatValue,
}: TelemetryGaugeProps) {
  const pct = clamp(((value - min) / (max - min)) * 100, 0, 100);
  const display = formatValue ? formatValue(value) : value.toFixed(1);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-canopy-300">{label}</span>
        <span className="font-mono text-sm text-canopy-100">
          {display}
          <span className="ml-0.5 text-xs text-canopy-400">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-canopy-700">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out")}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
