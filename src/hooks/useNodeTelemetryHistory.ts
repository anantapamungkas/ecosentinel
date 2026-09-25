"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { demoStore } from "@/lib/demo/store";
import type { TelemetryRow } from "@/types/database.types";

interface UseNodeTelemetryHistoryResult {
  history: TelemetryRow[];
  latest: TelemetryRow | null;
  isLoading: boolean;
  error: string | null;
}

const HISTORY_LIMIT = 200;

/**
 * Loads recent telemetry for a single node (oldest → newest, chart-ready)
 * and appends new readings live as the node reports in over LoRa.
 * Pass `nodeId: null` to stay idle, e.g. while no node is selected.
 *
 * When Supabase isn't configured, this reads from the in-memory demo
 * simulator instead — see `src/lib/demo/store.ts`.
 */
export function useNodeTelemetryHistory(nodeId: string | null): UseNodeTelemetryHistoryResult {
  const [history, setHistory] = useState<TelemetryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef(isSupabaseConfigured ? createClient() : null);

  useEffect(() => {
    if (!nodeId) {
      setHistory([]);
      return;
    }

    if (!isSupabaseConfigured) {
      setIsLoading(true);
      const unsubscribe = demoStore.subscribeTelemetry(nodeId, (next) => {
        setHistory(next);
        setIsLoading(false);
      });
      return unsubscribe;
    }

    const supabase = supabaseRef.current!;
    let isMounted = true;
    setIsLoading(true);

    async function fetchHistory() {
      const { data, error: fetchError } = await supabase
        .from("telemetry")
        .select("*")
        .eq("node_id", nodeId as string)
        .order("recorded_at", { ascending: false })
        .limit(HISTORY_LIMIT);

      if (!isMounted) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setHistory((data ?? []).slice().reverse());
        setError(null);
      }
      setIsLoading(false);
    }

    fetchHistory();

    const channel = supabase
      .channel(`realtime:telemetry-${nodeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "telemetry", filter: `node_id=eq.${nodeId}` },
        (payload) => {
          const newReading = payload.new as TelemetryRow;
          setHistory((current) => [...current, newReading].slice(-HISTORY_LIMIT));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [nodeId]);

  return {
    history,
    latest: history.at(-1) ?? null,
    isLoading,
    error,
  };
}
