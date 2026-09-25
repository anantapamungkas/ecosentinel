"use client";

import { useState, useTransition } from "react";
import type { AlertRow, MapNode } from "@/types/database.types";
import { ALERT_TYPE_LABELS, SEVERITY_COLORS, SEVERITY_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/config";
import { demoStore } from "@/lib/demo/store";
import { acknowledgeAlert } from "@/app/actions";

interface AlertItemProps {
  alert: AlertRow;
  node: MapNode | undefined;
  onSelectNode?: (nodeId: string) => void;
}

export function AlertItem({ alert, node, onSelectNode }: AlertItemProps) {
  const [operatorName, setOperatorName] = useState("");
  const [isEditingAck, setIsEditingAck] = useState(false);
  const [isPending, startTransition] = useTransition();
  const color = SEVERITY_COLORS[alert.severity];
  const isAcknowledged = Boolean(alert.acknowledged_at);

  function handleAcknowledge() {
    startTransition(async () => {
      const operator = operatorName.trim() || "Console Operator";
      if (isSupabaseConfigured) {
        await acknowledgeAlert(alert.id, operator);
      } else {
        demoStore.acknowledgeAlert(alert.id, operator);
      }
      setIsEditingAck(false);
    });
  }

  return (
    <div
      className="rounded border bg-canopy-800/60 p-3 transition"
      style={{ borderColor: isAcknowledged ? "#262626" : `${color}55` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
              style={{ color, backgroundColor: `${color}1A` }}
            >
              {SEVERITY_LABELS[alert.severity]}
            </span>
            <span className="font-mono text-[11px] text-canopy-400">{timeAgo(alert.created_at)}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-canopy-100">
            {ALERT_TYPE_LABELS[alert.alert_type]}
          </p>
          <p className="text-xs text-canopy-300">{alert.message}</p>
          {node && (
            <button
              onClick={() => onSelectNode?.(node.id)}
              className="mt-1 truncate font-mono text-[11px] text-canopy-400 underline decoration-canopy-500 underline-offset-2 hover:text-signal-gold"
            >
              {node.name} · {node.forest_zone}
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-canopy-600/60 pt-2">
        {isAcknowledged ? (
          <p className="font-mono text-[11px] text-signal-green">
            Acknowledged by {alert.acknowledged_by} · {timeAgo(alert.acknowledged_at)}
          </p>
        ) : isEditingAck ? (
          <div className="flex w-full items-center gap-1.5">
            <input
              autoFocus
              value={operatorName}
              onChange={(event) => setOperatorName(event.target.value)}
              placeholder="Your name"
              className="w-full rounded border border-canopy-600 bg-canopy-900 px-2 py-1 font-mono text-xs text-canopy-100 placeholder:text-canopy-400 focus:border-signal-gold"
              onKeyDown={(event) => event.key === "Enter" && handleAcknowledge()}
            />
            <button
              onClick={handleAcknowledge}
              disabled={isPending}
              className="shrink-0 rounded bg-canopy-100 px-2 py-1 font-mono text-xs font-medium text-canopy-950 hover:bg-white disabled:opacity-50"
            >
              {isPending ? "…" : "Confirm"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingAck(true)}
            className="font-mono text-[11px] uppercase tracking-wide text-canopy-300 transition hover:text-signal-gold"
          >
            Acknowledge
          </button>
        )}
      </div>
    </div>
  );
}
