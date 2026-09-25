import type { AlertSeverity, AlertType, NodeStatus } from "@/types/database.types";

export const STATUS_COLORS: Record<NodeStatus, string> = {
  normal: "#46A758",
  warning: "#F5A623",
  alert: "#EE0000",
  offline: "#737373",
};

export const STATUS_LABELS: Record<NodeStatus, string> = {
  normal: "Normal",
  warning: "Warning",
  alert: "Alert",
  offline: "Offline",
};

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: "#3291FF",
  warning: "#F5A623",
  critical: "#EE0000",
};

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  chainsaw: "Chainsaw Detected",
  tree_fall: "Tree Fall / Impact",
  tamper: "Node Tampering",
  low_battery: "Low Battery",
  offline: "Node Offline",
  geofence_breach: "Geofence Breach",
};

/** Node considered offline if no telemetry has arrived within this window. */
export const OFFLINE_THRESHOLD_MINUTES = 20;

/** Realtime channel names — kept centralized so hooks stay in sync. */
export const REALTIME_CHANNELS = {
  nodes: "realtime:nodes",
  telemetry: "realtime:telemetry",
  alerts: "realtime:alerts",
} as const;

export const MAP_DEFAULT_CENTER: [number, number] = [0.5375, 101.655];
export const MAP_DEFAULT_ZOOM = 14;
