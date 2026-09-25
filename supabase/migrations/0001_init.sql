-- ============================================================================
-- Anti-Illegal Logging Command Center — Initial Schema
-- Extensions: PostGIS for geospatial data, pgcrypto for UUIDs
-- ============================================================================

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

create type node_status as enum ('normal', 'warning', 'alert', 'offline');
create type alert_type as enum ('chainsaw', 'tree_fall', 'tamper', 'low_battery', 'offline', 'geofence_breach');
create type alert_severity as enum ('info', 'warning', 'critical');

-- ============================================================================
-- TABLE: nodes
-- One row per physical ESP32-S3 edge node deployed in the field.
-- ============================================================================

create table public.nodes (
  id                 uuid primary key default gen_random_uuid(),
  device_eui         text not null unique,                -- LoRaWAN DevEUI, e.g. "70B3D57ED0048A11"
  name               text not null,
  forest_zone        text not null,
  install_location   geography(point, 4326) not null,     -- fixed install coordinates
  current_location   geography(point, 4326) not null,     -- last reported GPS fix (may drift/tamper)
  status             node_status not null default 'normal',
  battery_pct        numeric(5,2) not null default 100 check (battery_pct between 0 and 100),
  rssi_dbm           integer,
  snr_db             numeric(5,2),
  firmware_version   text not null default '1.0.0',
  last_seen_at       timestamptz,
  is_active          boolean not null default true,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.nodes is 'Field-deployed ESP32-S3 LoRa edge nodes.';

create index nodes_status_idx on public.nodes (status);
create index nodes_forest_zone_idx on public.nodes (forest_zone);
create index nodes_current_location_gix on public.nodes using gist (current_location);
create index nodes_last_seen_idx on public.nodes (last_seen_at desc);

-- ============================================================================
-- TABLE: telemetry
-- Time-series sensor readings pushed by each node on every LoRa uplink.
-- ============================================================================

create table public.telemetry (
  id                    bigint generated always as identity primary key,
  node_id               uuid not null references public.nodes (id) on delete cascade,
  recorded_at           timestamptz not null default now(),
  location              geography(point, 4326) not null,
  battery_pct           numeric(5,2) not null check (battery_pct between 0 and 100),
  rssi_dbm              integer not null,
  snr_db                numeric(5,2) not null,
  temperature_c         numeric(5,2),
  humidity_pct          numeric(5,2),
  tilt_deg              numeric(5,2) not null default 0,       -- IMU tilt angle from vertical
  tilt_delta_deg        numeric(5,2) not null default 0,       -- change since previous reading
  impact_g              numeric(6,3) not null default 0,       -- peak IMU acceleration (g-force)
  acoustic_confidence   numeric(4,3) not null default 0 check (acoustic_confidence between 0 and 1), -- chainsaw classifier score
  acoustic_db           numeric(5,2),                          -- raw sound pressure level
  raw_payload           jsonb,
  created_at            timestamptz not null default now()
);

comment on table public.telemetry is 'Raw sensor uplinks: acoustic, IMU tilt/impact, environment, GPS, radio link quality.';

create index telemetry_node_id_recorded_at_idx on public.telemetry (node_id, recorded_at desc);
create index telemetry_recorded_at_idx on public.telemetry (recorded_at desc);
create index telemetry_location_gix on public.telemetry using gist (location);
create index telemetry_acoustic_confidence_idx on public.telemetry (acoustic_confidence desc);

-- ============================================================================
-- TABLE: alerts
-- Derived threat events raised from telemetry (chainsaw detected, tree fall, etc).
-- ============================================================================

create table public.alerts (
  id                bigint generated always as identity primary key,
  node_id           uuid not null references public.nodes (id) on delete cascade,
  telemetry_id      bigint references public.telemetry (id) on delete set null,
  alert_type        alert_type not null,
  severity          alert_severity not null default 'warning',
  confidence        numeric(4,3) not null default 0 check (confidence between 0 and 1),
  message           text not null,
  location          geography(point, 4326) not null,
  acknowledged_at   timestamptz,
  acknowledged_by   text,
  resolved_at       timestamptz,
  resolution_note   text,
  created_at        timestamptz not null default now()
);

comment on table public.alerts is 'Actionable threat events surfaced to operators, derived from telemetry.';

create index alerts_node_id_idx on public.alerts (node_id);
create index alerts_created_at_idx on public.alerts (created_at desc);
create index alerts_unacknowledged_idx on public.alerts (created_at desc) where acknowledged_at is null;
create index alerts_severity_idx on public.alerts (severity);

-- ============================================================================
-- FUNCTION + TRIGGER: keep nodes.updated_at fresh
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger nodes_set_updated_at
before update on public.nodes
for each row execute function public.set_updated_at();

-- ============================================================================
-- FUNCTION + TRIGGER: on new telemetry, roll it up onto the parent node
-- and auto-derive alerts when thresholds are crossed.
-- ============================================================================

create or replace function public.handle_new_telemetry()
returns trigger
language plpgsql
as $$
declare
  v_new_status node_status := 'normal';
  v_alert_type alert_type;
  v_severity   alert_severity;
  v_message    text;
begin
  -- Determine node status from this reading
  if new.acoustic_confidence >= 0.85 or new.tilt_deg >= 35 or new.impact_g >= 2.5 then
    v_new_status := 'alert';
  elsif new.acoustic_confidence >= 0.55 or new.tilt_deg >= 15 or new.impact_g >= 1.2 or new.battery_pct <= 15 then
    v_new_status := 'warning';
  end if;

  update public.nodes
  set current_location = new.location,
      battery_pct      = new.battery_pct,
      rssi_dbm         = new.rssi_dbm,
      snr_db           = new.snr_db,
      status           = v_new_status,
      last_seen_at     = new.recorded_at
  where id = new.node_id;

  -- Chainsaw acoustic detection
  if new.acoustic_confidence >= 0.55 then
    v_alert_type := 'chainsaw';
    v_severity := case when new.acoustic_confidence >= 0.85 then 'critical' else 'warning' end;
    v_message := format('Chainsaw acoustic signature detected at %s%% confidence', round(new.acoustic_confidence * 100));
    insert into public.alerts (node_id, telemetry_id, alert_type, severity, confidence, message, location)
    values (new.node_id, new.id, v_alert_type, v_severity, new.acoustic_confidence, v_message, new.location);
  end if;

  -- Tree fall / severe tilt detection
  if new.tilt_deg >= 15 or new.impact_g >= 1.2 then
    v_alert_type := 'tree_fall';
    v_severity := case when new.tilt_deg >= 35 or new.impact_g >= 2.5 then 'critical' else 'warning' end;
    v_message := format('Tree movement detected: tilt %s°, impact %sg', round(new.tilt_deg, 1), round(new.impact_g, 2));
    insert into public.alerts (node_id, telemetry_id, alert_type, severity, confidence, message, location)
    values (
      new.node_id, new.id, v_alert_type, v_severity,
      least(1.0, greatest(new.tilt_deg / 45.0, new.impact_g / 4.0)),
      v_message, new.location
    );
  end if;

  -- Low battery
  if new.battery_pct <= 15 then
    insert into public.alerts (node_id, telemetry_id, alert_type, severity, confidence, message, location)
    values (
      new.node_id, new.id, 'low_battery', 'warning', 1.0,
      format('Battery at %s%% — field service required', round(new.battery_pct)),
      new.location
    );
  end if;

  return new;
end;
$$;

create trigger telemetry_after_insert
after insert on public.telemetry
for each row execute function public.handle_new_telemetry();

-- ============================================================================
-- VIEW: node_latest_telemetry — convenience join for dashboards
-- ============================================================================

create or replace view public.node_latest_telemetry as
select distinct on (t.node_id)
  t.node_id,
  t.id as telemetry_id,
  t.recorded_at,
  t.battery_pct,
  t.rssi_dbm,
  t.snr_db,
  t.temperature_c,
  t.humidity_pct,
  t.tilt_deg,
  t.tilt_delta_deg,
  t.impact_g,
  t.acoustic_confidence,
  t.acoustic_db,
  st_y(t.location::geometry) as latitude,
  st_x(t.location::geometry) as longitude
from public.telemetry t
order by t.node_id, t.recorded_at desc;

-- ============================================================================
-- VIEW: nodes_with_coords — nodes with geography columns flattened to
-- plain float lat/lng so the client never has to parse WKB/GeoJSON.
-- ============================================================================

create or replace view public.nodes_with_coords as
select
  n.id,
  n.device_eui,
  n.name,
  n.forest_zone,
  n.status,
  n.battery_pct,
  n.rssi_dbm,
  n.snr_db,
  n.firmware_version,
  n.last_seen_at,
  n.is_active,
  n.notes,
  n.created_at,
  n.updated_at,
  st_y(n.current_location::geometry) as latitude,
  st_x(n.current_location::geometry) as longitude,
  st_y(n.install_location::geometry) as install_latitude,
  st_x(n.install_location::geometry) as install_longitude
from public.nodes n;

-- ============================================================================
-- FUNCTION: ingest_telemetry — single RPC entry point for the edge-ingest
-- API route (called with the service role key, bypassing RLS). Keeps raw
-- lat/lng math out of application code and off the client entirely.
-- ============================================================================

create or replace function public.ingest_telemetry(
  p_device_eui         text,
  p_latitude           double precision,
  p_longitude          double precision,
  p_battery_pct        numeric,
  p_rssi_dbm           integer,
  p_snr_db             numeric,
  p_temperature_c      numeric default null,
  p_humidity_pct       numeric default null,
  p_tilt_deg           numeric default 0,
  p_tilt_delta_deg     numeric default 0,
  p_impact_g           numeric default 0,
  p_acoustic_confidence numeric default 0,
  p_acoustic_db        numeric default null,
  p_raw_payload        jsonb default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_node_id uuid;
  v_telemetry_id bigint;
begin
  select id into v_node_id from public.nodes where device_eui = p_device_eui;

  if v_node_id is null then
    raise exception 'Unknown device_eui: %', p_device_eui;
  end if;

  insert into public.telemetry (
    node_id, location, battery_pct, rssi_dbm, snr_db,
    temperature_c, humidity_pct, tilt_deg, tilt_delta_deg, impact_g,
    acoustic_confidence, acoustic_db, raw_payload
  ) values (
    v_node_id, st_point(p_longitude, p_latitude)::geography, p_battery_pct, p_rssi_dbm, p_snr_db,
    p_temperature_c, p_humidity_pct, p_tilt_deg, p_tilt_delta_deg, p_impact_g,
    p_acoustic_confidence, p_acoustic_db, p_raw_payload
  )
  returning id into v_telemetry_id;

  return v_telemetry_id;
end;
$$;

revoke all on function public.ingest_telemetry from public;
grant execute on function public.ingest_telemetry to service_role;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.nodes enable row level security;
alter table public.telemetry enable row level security;
alter table public.alerts enable row level security;

-- Operators (any authenticated user) can read everything.
create policy "Authenticated read access on nodes"
  on public.nodes for select
  to authenticated
  using (true);

create policy "Authenticated read access on telemetry"
  on public.telemetry for select
  to authenticated
  using (true);

create policy "Authenticated read access on alerts"
  on public.alerts for select
  to authenticated
  using (true);

-- Operators can acknowledge / resolve alerts.
create policy "Authenticated can acknowledge alerts"
  on public.alerts for update
  to authenticated
  using (true)
  with check (true);

-- Edge nodes authenticate with the service role key (server-side ingest route),
-- which bypasses RLS entirely, so no insert policy is granted to anon/authenticated
-- for telemetry or nodes — this prevents spoofed sensor data from the browser.
create policy "Authenticated can update node metadata"
  on public.nodes for update
  to authenticated
  using (true)
  with check (true);

-- ============================================================================
-- REALTIME
-- ============================================================================

alter publication supabase_realtime add table public.nodes;
alter publication supabase_realtime add table public.telemetry;
alter publication supabase_realtime add table public.alerts;

alter table public.nodes replica identity full;
alter table public.telemetry replica identity full;
alter table public.alerts replica identity full;
