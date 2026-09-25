"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { demoStore } from "@/lib/demo/store";
import type { AlertRow } from "@/types/database.types";

interface UseRealtimeAlertsResult {
  alerts: AlertRow[];
  isLoading: boolean;
  error: string | null;
}

const FEED_LIMIT = 100;

/**
 * Streams the most recent alerts and keeps the feed live: new alerts are
 * prepended as they're inserted, and acknowledgements/resolutions update
 * the matching row in place.
 *
 * When Supabase isn't configured, this reads from the in-memory demo
 * simulator instead — see `src/lib/demo/store.ts`.
 */
export function useRealtimeAlerts(): UseRealtimeAlertsResult {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef(isSupabaseConfigured ? createClient() : null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const unsubscribe = demoStore.subscribeAlerts((next) => {
        setAlerts(next);
        setIsLoading(false);
      });
      return unsubscribe;
    }

    const supabase = supabaseRef.current!;
    let isMounted = true;

    async function fetchAlerts() {
      const { data, error: fetchError } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(FEED_LIMIT);

      if (!isMounted) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setAlerts(data ?? []);
        setError(null);
      }
      setIsLoading(false);
    }

    fetchAlerts();

    const channel = supabase
      .channel("realtime:alerts-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          const newAlert = payload.new as AlertRow;
          setAlerts((current) => [newAlert, ...current].slice(0, FEED_LIMIT));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "alerts" },
        (payload) => {
          const updatedAlert = payload.new as AlertRow;
          setAlerts((current) =>
            current.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert))
          );
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { alerts, isLoading, error };
}
