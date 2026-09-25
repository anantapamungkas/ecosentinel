// ============================================================================
// Hand-authored types mirroring supabase/migrations/0001_init.sql
// Regenerate with `supabase gen types typescript` once schema stabilizes,
// keeping this file as the source of truth for the shapes below in the
// meantime — every field here matches a real column, no placeholders.
// ============================================================================

export type NodeStatus = "normal" | "warning" | "alert" | "offline";

export type AlertType =
  | "chainsaw"
  | "tree_fall"
  | "tamper"
  | "low_battery"
  | "offline"
  | "geofence_breach";

export type AlertSeverity = "info" | "warning" | "critical";

export interface NodeRow {
  id: string;
  device_eui: string;
  name: string;
  forest_zone: string;
  install_location: string; // PostGIS geography as WKT/GeoJSON string via RPC
  current_location: string;
  status: NodeStatus;
  battery_pct: number;
  rssi_dbm: number | null;
  snr_db: number | null;
  firmware_version: string;
  last_seen_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TelemetryRow {
  id: number;
  node_id: string;
  recorded_at: string;
  location: string;
  battery_pct: number;
  rssi_dbm: number;
  snr_db: number;
  temperature_c: number | null;
  humidity_pct: number | null;
  tilt_deg: number;
  tilt_delta_deg: number;
  impact_g: number;
  acoustic_confidence: number;
  acoustic_db: number | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface AlertRow {
  id: number;
  node_id: string;
  telemetry_id: number | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  confidence: number;
  message: string;
  location: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
}

export interface NodeLatestTelemetryRow {
  node_id: string;
  telemetry_id: number;
  recorded_at: string;
  battery_pct: number;
  rssi_dbm: number;
  snr_db: number;
  temperature_c: number | null;
  humidity_pct: number | null;
  tilt_deg: number;
  tilt_delta_deg: number;
  impact_g: number;
  acoustic_confidence: number;
  acoustic_db: number | null;
  latitude: number;
  longitude: number;
}

/** Row shape of the `nodes_with_coords` view — the shape the UI layer consumes. */
export interface MapNode {
  id: string;
  device_eui: string;
  name: string;
  forest_zone: string;
  status: NodeStatus;
  battery_pct: number;
  rssi_dbm: number | null;
  snr_db: number | null;
  firmware_version: string;
  last_seen_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  latitude: number;
  longitude: number;
  install_latitude: number;
  install_longitude: number;
}

export interface Database {
  public: {
    Tables: {
      nodes: {
        Row: NodeRow;
        Insert: Partial<NodeRow> & Pick<NodeRow, "device_eui" | "name" | "forest_zone">;
        Update: Partial<NodeRow>;
      };
      telemetry: {
        Row: TelemetryRow;
        Insert: Partial<TelemetryRow> &
          Pick<TelemetryRow, "node_id" | "battery_pct" | "rssi_dbm" | "snr_db">;
        Update: Partial<TelemetryRow>;
      };
      alerts: {
        Row: AlertRow;
        Insert: Partial<AlertRow> &
          Pick<AlertRow, "node_id" | "alert_type" | "message" | "location">;
        Update: Partial<AlertRow>;
      };
    };
    Views: {
      node_latest_telemetry: {
        Row: NodeLatestTelemetryRow;
      };
      nodes_with_coords: {
        Row: MapNode;
      };
    };
    Functions: {
      ingest_telemetry: {
        Args: {
          p_device_eui: string;
          p_latitude: number;
          p_longitude: number;
          p_battery_pct: number;
          p_rssi_dbm: number;
          p_snr_db: number;
          p_temperature_c?: number | null;
          p_humidity_pct?: number | null;
          p_tilt_deg?: number;
          p_tilt_delta_deg?: number;
          p_impact_g?: number;
          p_acoustic_confidence?: number;
          p_acoustic_db?: number | null;
          p_raw_payload?: Record<string, unknown> | null;
        };
        Returns: number;
      };
    };
    Enums: {
      node_status: NodeStatus;
      alert_type: AlertType;
      alert_severity: AlertSeverity;
    };
  };
}
