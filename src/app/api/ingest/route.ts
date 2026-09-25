import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

interface IngestPayload {
  device_eui: string;
  latitude: number;
  longitude: number;
  battery_pct: number;
  rssi_dbm: number;
  snr_db: number;
  temperature_c?: number;
  humidity_pct?: number;
  tilt_deg?: number;
  tilt_delta_deg?: number;
  impact_g?: number;
  acoustic_confidence?: number;
  acoustic_db?: number;
  raw_payload?: Record<string, unknown>;
}

const REQUIRED_FIELDS: (keyof IngestPayload)[] = [
  "device_eui",
  "latitude",
  "longitude",
  "battery_pct",
  "rssi_dbm",
  "snr_db",
];

function isValidPayload(body: unknown): body is IngestPayload {
  if (typeof body !== "object" || body === null) return false;
  const record = body as Record<string, unknown>;
  return REQUIRED_FIELDS.every((field) => record[field] !== undefined && record[field] !== null);
}

/**
 * POST /api/ingest
 *
 * Entry point for the LoRaWAN network server's uplink webhook (e.g. The
 * Things Network, ChirpStack). Each ESP32-S3 edge node's decoded uplink is
 * forwarded here as JSON, authenticated with a shared bearer secret, and
 * written straight into Postgres via the `ingest_telemetry` RPC using the
 * service role key — so RLS never has to trust the public internet.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      {
        error:
          "Supabase isn't configured on this deployment (NEXT_PUBLIC_SUPABASE_URL is unset). The dashboard is running in demo mode with simulated data and has no database to ingest into.",
      },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.INGEST_SHARED_SECRET;

  if (!expectedSecret) {
    console.error("INGEST_SHARED_SECRET is not configured on the server.");
    return NextResponse.json({ error: "Ingest endpoint misconfigured." }, { status: 500 });
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json(
      { error: `Missing required fields. Expected: ${REQUIRED_FIELDS.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc("ingest_telemetry", {
    p_device_eui: body.device_eui,
    p_latitude: body.latitude,
    p_longitude: body.longitude,
    p_battery_pct: body.battery_pct,
    p_rssi_dbm: body.rssi_dbm,
    p_snr_db: body.snr_db,
    p_temperature_c: body.temperature_c ?? null,
    p_humidity_pct: body.humidity_pct ?? null,
    p_tilt_deg: body.tilt_deg ?? 0,
    p_tilt_delta_deg: body.tilt_delta_deg ?? 0,
    p_impact_g: body.impact_g ?? 0,
    p_acoustic_confidence: body.acoustic_confidence ?? 0,
    p_acoustic_db: body.acoustic_db ?? null,
    p_raw_payload: body.raw_payload ?? null,
  });

  if (error) {
    console.error("ingest_telemetry RPC failed:", error);
    const status = error.message.includes("Unknown device_eui") ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ telemetry_id: data }, { status: 201 });
}
