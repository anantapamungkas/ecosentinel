"use client";

import dynamic from "next/dynamic";
import type { MapNode } from "@/types/database.types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// react-leaflet touches `window` on import, so it must never be pulled into
// the server bundle — load it lazily, client-side only.
const NodeMap = dynamic(() => import("@/components/map/NodeMap").then((mod) => mod.NodeMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-canopy-900">
      <LoadingSpinner label="Loading map…" />
    </div>
  ),
});

interface NodeMapClientProps {
  nodes: MapNode[];
  onSelectNode: (node: MapNode) => void;
}

export function NodeMapClient({ nodes, onSelectNode }: NodeMapClientProps) {
  return <NodeMap nodes={nodes} onSelectNode={onSelectNode} />;
}
