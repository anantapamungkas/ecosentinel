"use client";

import { isSupabaseConfigured } from "@/lib/config";

interface HeaderProps {
  isRealtimeConnected: boolean;
  totalNodes: number;
  activeAlertCount: number;
}

export function Header({ isRealtimeConnected, totalNodes, activeAlertCount }: HeaderProps) {
  const statusLabel = !isSupabaseConfigured
    ? "Demo Data"
    : isRealtimeConnected
      ? "Live"
      : "Reconnecting";
  const statusColor = !isSupabaseConfigured ? "#0070F3" : isRealtimeConnected ? "#46A758" : "#EE0000";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-canopy-600 bg-canopy-900 px-5">
      <div className="flex items-center gap-3">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2L3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5z"
            stroke="#0070F3"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M12 8v8M8.5 10l3.5-2 3.5 2M8.5 14l3.5 2 3.5-2" stroke="#46A758" strokeWidth="1.4" />
        </svg>
        <div>
          <h1 className="font-mono text-sm font-semibold uppercase tracking-wide text-canopy-100">
            EcoSentinel
          </h1>
          <p className="max-w-[360px] truncate text-[11px] text-canopy-400">
            Anti-Illegal Logging Command Center · Santri Lab, Universitas Jember
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden items-center gap-4 sm:flex">
          <div className="text-right">
            <p className="font-mono text-sm text-canopy-100">{totalNodes}</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-canopy-400">Nodes</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm text-signal-red">{activeAlertCount}</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-canopy-400">Active Threats</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded border border-canopy-600 px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
          <span className="font-mono text-[11px] uppercase tracking-wide text-canopy-300">
            {statusLabel}
          </span>
        </div>
      </div>
    </header>
  );
}
