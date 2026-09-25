"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TelemetryRow } from "@/types/database.types";
import { formatChartTime, formatTimestamp } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

interface TelemetryHistoryChartsProps {
  history: TelemetryRow[];
  isLoading: boolean;
}

interface ChartDatum {
  recorded_at: string;
  tilt_deg: number;
  acoustic_confidence: number;
  rssi_dbm: number;
  snr_db: number;
}

function CustomTooltip({
  active,
  payload,
  label,
  valueLabel,
  suffix,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  valueLabel: string;
  suffix: string;
}) {
  if (!active || !payload || payload.length === 0 || !label) return null;
  return (
    <div className="rounded border border-canopy-600 bg-canopy-800 px-2.5 py-1.5 font-mono text-xs shadow-panel">
      <p className="text-canopy-400">{formatTimestamp(label)}</p>
      <p className="text-canopy-100">
        {valueLabel}: {payload[0]?.value.toFixed(1)}
        {suffix}
      </p>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-canopy-600 bg-canopy-800/60 p-3">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-canopy-300">{title}</p>
      <div className="h-40 w-full">{children}</div>
    </div>
  );
}

export function TelemetryHistoryCharts({ history, isLoading }: TelemetryHistoryChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded border border-canopy-600 bg-canopy-800/40" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <EmptyState
        title="No telemetry history yet"
        description="This node hasn't reported any readings in the selected window."
      />
    );
  }

  const data: ChartDatum[] = history.map((row) => ({
    recorded_at: row.recorded_at,
    tilt_deg: row.tilt_deg,
    acoustic_confidence: row.acoustic_confidence * 100,
    rssi_dbm: row.rssi_dbm,
    snr_db: row.snr_db,
  }));

  return (
    <div className="grid grid-cols-1 gap-3">
      <ChartPanel title="Tree Tilt (degrees)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tiltGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5A623" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#F5A623" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="recorded_at"
              tickFormatter={formatChartTime}
              stroke="#737373"
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              minTickGap={40}
            />
            <YAxis
              stroke="#737373"
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              width={32}
              domain={[0, "dataMax + 5"]}
            />
            <Tooltip content={<CustomTooltip valueLabel="Tilt" suffix="°" />} />
            <Area
              type="monotone"
              dataKey="tilt_deg"
              stroke="#F5A623"
              fill="url(#tiltGradient)"
              strokeWidth={1.75}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Acoustic Threat Confidence (%)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="acousticGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EE0000" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#EE0000" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="recorded_at"
              tickFormatter={formatChartTime}
              stroke="#737373"
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              minTickGap={40}
            />
            <YAxis
              stroke="#737373"
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              width={32}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip valueLabel="Confidence" suffix="%" />} />
            <Area
              type="monotone"
              dataKey="acoustic_confidence"
              stroke="#EE0000"
              fill="url(#acousticGradient)"
              strokeWidth={1.75}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Signal Quality (RSSI dBm)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="recorded_at"
              tickFormatter={formatChartTime}
              stroke="#737373"
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              minTickGap={40}
            />
            <YAxis
              stroke="#737373"
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              width={36}
              domain={["dataMin - 10", "dataMax + 10"]}
            />
            <Tooltip content={<CustomTooltip valueLabel="RSSI" suffix=" dBm" />} />
            <Line
              type="monotone"
              dataKey="rssi_dbm"
              stroke="#3291FF"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}
