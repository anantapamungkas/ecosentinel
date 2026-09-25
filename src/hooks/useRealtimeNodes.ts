"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { demoStore } from "@/lib/demo/store";
import type { MapNode } from "@/types/database.types";

interface UseRealtimeNodesResult {
  nodes: MapNode[];
  nodesById: Map<string, MapNode>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Loads all nodes from the flattened `nodes_with_coords` view and keeps them
 * live via Supabase Realtime. Because geography columns don't arrive as
 * usable lat/lng on the raw Postgres Changes payload, any INSERT/UPDATE/DELETE
 * on `nodes` triggers a lightweight refetch of the view rather than a manual
 * merge — nodes are a small, low-churn table so this stays cheap.
 *
 * When Supabase isn't configured (no `.env.local`), this transparently reads
 * from the in-memory demo simulator instead — see `src/lib/demo/store.ts`.
 */
export function useRealtimeNodes(): UseRealtimeNodesResult {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef(isSupabaseConfigured ? createClient() : null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const unsubscribe = demoStore.subscribeNodes((next) => {
        setNodes(next);
        setIsLoading(false);
      });
      return unsubscribe;
    }

    const supabase = supabaseRef.current!;
    let isMounted = true;

    async function fetchNodes() {
      const { data, error: fetchError } = await supabase
        .from("nodes_with_coords")
        .select("*")
        .order("name", { ascending: true });

      if (!isMounted) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setNodes(data ?? []);
        setError(null);
      }
      setIsLoading(false);
    }

    fetchNodes();

    const channel = supabase
      .channel("realtime:nodes-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "nodes" }, () => {
        fetchNodes();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return { nodes, nodesById, isLoading, error };
}
