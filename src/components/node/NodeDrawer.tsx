"use client";

import { useEffect, useState, useTransition } from "react";
import type { MapNode } from "@/types/database.types";
import { useNodeTelemetryHistory } from "@/hooks/useNodeTelemetryHistory";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BatteryIndicator } from "@/components/node/BatteryIndicator";
import { SignalIndicator } from "@/components/node/SignalIndicator";
import { TelemetryGauge } from "@/components/node/TelemetryGauge";
import { TelemetryHistoryCharts } from "@/components/charts/TelemetryHistoryCharts";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { updateNodeNotes } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/config";
import { demoStore } from "@/lib/demo/store";
import { formatCoord, formatTimestamp, timeAgo } from "@/lib/utils";

interface NodeDrawerProps {
  node: MapNode | null;
  onClose: () => void;
}

export function NodeDrawer({ node, onClose }: NodeDrawerProps) {
  const { history, latest, isLoading } = useNodeTelemetryHistory(node?.id ?? null);
  const [notes, setNotes] = useState(node?.notes ?? "");
  const [isPending, startTransition] = useTransition();
  const [savedNodeId, setSavedNodeId] = useState<string | null>(null);

  useEffect(() => {
    setNotes(node?.notes ?? "");
    setSavedNodeId(null);
  }, [node?.id, node?.notes]);

  if (!node) return null;

  function handleSaveNotes() {
    if (!node) return;
    startTransition(async () => {
      if (isSupabaseConfigured) {
        await updateNodeNotes(node.id, notes);
      } else {
        demoStore.updateNodeNotes(node.id, notes);
      }
      setSavedNodeId(node.id);
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed right-0 top-0 z-[1110] flex h-full w-full max-w-md flex-col border-l border-canopy-600 bg-canopy-900 shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-canopy-600 px-5 py-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-canopy-400">
              {node.device_eui}
            </p>
            <h2 className="text-lg font-semibold text-canopy-100">{node.name}</h2>
            <p className="text-xs text-canopy-300">{node.forest_zone}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-canopy-300 transition hover:bg-canopy-700 hover:text-canopy-100"
            aria-label="Close node details"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <StatusBadge status={node.status} pulse={node.status === "alert"} />
            <span className="font-mono text-xs text-canopy-400">
              Last seen {timeAgo(node.last_seen_at)}
            </span>
          </div>

          <section className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded border border-canopy-600 bg-canopy-800/60 p-3">
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-canopy-400">Battery</p>
              <BatteryIndicator percent={node.battery_pct} />
            </div>
            <div className="rounded border border-canopy-600 bg-canopy-800/60 p-3">
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-canopy-400">Link Quality</p>
              <SignalIndicator rssi={node.rssi_dbm} snr={node.snr_db} />
            </div>
            <div className="rounded border border-canopy-600 bg-canopy-800/60 p-3">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-canopy-400">Firmware</p>
              <p className="font-mono text-sm text-canopy-100">v{node.firmware_version}</p>
            </div>
            <div className="rounded border border-canopy-600 bg-canopy-800/60 p-3">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-canopy-400">Position</p>
              <p className="font-mono text-xs text-canopy-100">
                {formatCoord(node.latitude)}, {formatCoord(node.longitude)}
              </p>
            </div>
          </section>

          <section className="mb-5">
            <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-canopy-300">
              Live Readings
            </h3>
            {isLoading && !latest ? (
              <LoadingSpinner label="Loading latest telemetry…" />
            ) : latest ? (
              <div className="flex flex-col gap-3 rounded border border-canopy-600 bg-canopy-800/60 p-3">
                <TelemetryGauge
                  label="Tree Tilt"
                  value={latest.tilt_deg}
                  unit="°"
                  max={45}
                  color="#F5A623"
                />
                <TelemetryGauge
                  label="Acoustic Confidence"
                  value={latest.acoustic_confidence * 100}
                  unit="%"
                  max={100}
                  color="#EE0000"
                />
                <TelemetryGauge
                  label="Impact"
                  value={latest.impact_g}
                  unit="g"
                  max={4}
                  color="#3291FF"
                />
                <p className="font-mono text-[10px] text-canopy-400">
                  Reading captured {formatTimestamp(latest.recorded_at)}
                </p>
              </div>
            ) : (
              <p className="font-mono text-xs text-canopy-400">No telemetry recorded for this node yet.</p>
            )}
          </section>

          <section className="mb-5">
            <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-canopy-300">
              6-Hour History
            </h3>
            <TelemetryHistoryCharts history={history} isLoading={isLoading} />
          </section>

          <section>
            <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-canopy-300">
              Patrol Notes
            </h3>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add instructions or context for the field team…"
              rows={3}
              className="w-full resize-none rounded border border-canopy-600 bg-canopy-800/60 p-2.5 text-sm text-canopy-100 placeholder:text-canopy-400 focus:border-signal-gold"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={handleSaveNotes}
                disabled={isPending}
                className="rounded bg-canopy-100 px-3 py-1.5 font-mono text-xs font-medium text-canopy-950 transition hover:bg-white disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save note"}
              </button>
              {savedNodeId === node.id && !isPending && (
                <span className="font-mono text-xs text-signal-green">Saved</span>
              )}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
