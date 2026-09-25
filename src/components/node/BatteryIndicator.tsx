import { cn } from "@/lib/utils";

interface BatteryIndicatorProps {
  percent: number;
  className?: string;
}

export function BatteryIndicator({ percent, className }: BatteryIndicatorProps) {
  const color = percent <= 15 ? "#EE0000" : percent <= 35 ? "#F5A623" : "#46A758";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="relative flex h-3 w-6 items-center rounded-sm border border-canopy-500 p-[1.5px]">
        <div
          className="h-full rounded-[1px]"
          style={{ width: `${Math.max(4, percent)}%`, backgroundColor: color }}
        />
        <div className="absolute -right-[3px] h-1.5 w-[2px] rounded-r-sm bg-canopy-500" />
      </div>
      <span className="font-mono text-xs text-canopy-200">{percent.toFixed(0)}%</span>
    </div>
  );
}
