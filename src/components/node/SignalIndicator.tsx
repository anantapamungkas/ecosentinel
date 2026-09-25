import { cn } from "@/lib/utils";

interface SignalIndicatorProps {
  rssi: number | null;
  snr: number | null;
  className?: string;
}

/** Converts an RSSI reading (dBm) into a 4-bar signal strength glyph. */
function barsForRssi(rssi: number | null): number {
  if (rssi === null) return 0;
  if (rssi >= -80) return 4;
  if (rssi >= -95) return 3;
  if (rssi >= -105) return 2;
  return 1;
}

export function SignalIndicator({ rssi, snr, className }: SignalIndicatorProps) {
  const bars = barsForRssi(rssi);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-end gap-[2px]" aria-hidden>
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className="w-[3px] rounded-sm"
            style={{
              height: `${bar * 3 + 3}px`,
              backgroundColor: bar <= bars ? "#46A758" : "#262626",
            }}
          />
        ))}
      </div>
      <span className="font-mono text-xs text-canopy-200">
        {rssi ?? "—"} dBm
        <span className="text-canopy-400"> · SNR {snr?.toFixed(1) ?? "—"}</span>
      </span>
    </div>
  );
}
