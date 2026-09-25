import type { AlertRow, MapNode, TelemetryRow } from "@/types/database.types";

/**
 * Static starting point for demo mode — deliberately mirrors
 * `supabase/seed.sql` so the dashboard looks identical whether you're
 * pointed at a real Supabase project or running with no backend at all.
 */
export const INITIAL_MOCK_NODES: MapNode[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    device_eui: "70B3D57ED0048A11",
    name: "Node Alpha",
    forest_zone: "Block 4 — Riverline",
    status: "normal",
    battery_pct: 92,
    rssi_dbm: -78,
    snr_db: 9.1,
    firmware_version: "1.4.2",
    last_seen_at: new Date().toISOString(),
    is_active: true,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    latitude: 0.5321,
    longitude: 101.6421,
    install_latitude: 0.5321,
    install_longitude: 101.6421,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    device_eui: "70B3D57ED0048A22",
    name: "Node Bravo",
    forest_zone: "Block 4 — Riverline",
    status: "warning",
    battery_pct: 61,
    rssi_dbm: -92,
    snr_db: 5.4,
    firmware_version: "1.4.2",
    last_seen_at: new Date().toISOString(),
    is_active: true,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    latitude: 0.5289,
    longitude: 101.6502,
    install_latitude: 0.5289,
    install_longitude: 101.6502,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    device_eui: "70B3D57ED0048A33",
    name: "Node Charlie",
    forest_zone: "Block 7 — Ridge Trail",
    status: "normal",
    battery_pct: 45,
    rssi_dbm: -101,
    snr_db: 2.1,
    firmware_version: "1.4.1",
    last_seen_at: new Date().toISOString(),
    is_active: true,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    latitude: 0.541,
    longitude: 101.6688,
    install_latitude: 0.541,
    install_longitude: 101.6688,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    device_eui: "70B3D57ED0048A44",
    name: "Node Delta",
    forest_zone: "Block 7 — Ridge Trail",
    status: "normal",
    battery_pct: 88,
    rssi_dbm: -71,
    snr_db: 10.3,
    firmware_version: "1.4.2",
    last_seen_at: new Date().toISOString(),
    is_active: true,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    latitude: 0.5378,
    longitude: 101.6737,
    install_latitude: 0.5378,
    install_longitude: 101.6737,
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    device_eui: "70B3D57ED0048A55",
    name: "Node Echo",
    forest_zone: "Block 2 — Buffer Zone",
    status: "offline",
    battery_pct: 12,
    rssi_dbm: -110,
    snr_db: 0.8,
    firmware_version: "1.3.9",
    last_seen_at: new Date(Date.now() - 54 * 60 * 1000).toISOString(),
    is_active: true,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    latitude: 0.5502,
    longitude: 101.6299,
    install_latitude: 0.5502,
    install_longitude: 101.6299,
  },
];

/** The node that periodically "acts up" in the simulator to keep the demo lively. */
export const HOTSPOT_NODE_ID = "33333333-3333-4333-8333-333333333333";

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Builds six hours of quiet baseline telemetry (5-minute cadence) for every node. */
export function buildInitialTelemetry(nodes: MapNode[]): Map<string, TelemetryRow[]> {
  const telemetryByNode = new Map<string, TelemetryRow[]>();
  const now = Date.now();
  const sixHoursMs = 6 * 60 * 60 * 1000;
  const stepMs = 5 * 60 * 1000;
  let nextId = 1;

  for (const node of nodes) {
    const rows: TelemetryRow[] = [];
    for (let t = now - sixHoursMs; t <= now; t += stepMs) {
      rows.push({
        id: nextId++,
        node_id: node.id,
        recorded_at: new Date(t).toISOString(),
        location: "",
        battery_pct: node.battery_pct,
        rssi_dbm: node.rssi_dbm ?? -85,
        snr_db: node.snr_db ?? 6,
        temperature_c: 24 + randomInRange(0, 6),
        humidity_pct: 65 + randomInRange(0, 20),
        tilt_deg: randomInRange(0, 3),
        tilt_delta_deg: randomInRange(-0.3, 0.3),
        impact_g: randomInRange(0, 0.4),
        acoustic_confidence: randomInRange(0, 0.12),
        acoustic_db: 38 + randomInRange(0, 6),
        raw_payload: null,
        created_at: new Date(t).toISOString(),
      });
    }
    telemetryByNode.set(node.id, rows);
  }

  return telemetryByNode;
}

export const INITIAL_MOCK_ALERTS: AlertRow[] = [];
