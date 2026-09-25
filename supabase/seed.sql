-- ============================================================================
-- Development seed data — five nodes scattered through a fictional
-- concession block, plus a rolling window of telemetry history.
-- Safe to run repeatedly against a local `supabase start` instance.
-- ============================================================================

truncate table public.alerts restart identity cascade;
truncate table public.telemetry restart identity cascade;
truncate table public.nodes restart identity cascade;

insert into public.nodes (id, device_eui, name, forest_zone, install_location, current_location, status, battery_pct, rssi_dbm, snr_db, firmware_version, last_seen_at)
values
  ('11111111-1111-4111-8111-111111111111', '70B3D57ED0048A11', 'Node Alpha',   'Block 4 — Riverline',   st_point(101.6421, 0.5321)::geography, st_point(101.6421, 0.5321)::geography, 'normal',  92, -78, 9.1,  '1.4.2', now() - interval '2 minutes'),
  ('22222222-2222-4222-8222-222222222222', '70B3D57ED0048A22', 'Node Bravo',   'Block 4 — Riverline',   st_point(101.6502, 0.5289)::geography, st_point(101.6502, 0.5289)::geography, 'warning', 61, -92, 5.4,  '1.4.2', now() - interval '1 minute'),
  ('33333333-3333-4333-8333-333333333333', '70B3D57ED0048A33', 'Node Charlie', 'Block 7 — Ridge Trail', st_point(101.6688, 0.5410)::geography, st_point(101.6688, 0.5410)::geography, 'alert',   45, -101, 2.1, '1.4.1', now() - interval '30 seconds'),
  ('44444444-4444-4444-8444-444444444444', '70B3D57ED0048A44', 'Node Delta',   'Block 7 — Ridge Trail', st_point(101.6737, 0.5378)::geography, st_point(101.6737, 0.5378)::geography, 'normal',  88, -71, 10.3, '1.4.2', now() - interval '3 minutes'),
  ('55555555-5555-4555-8555-555555555555', '70B3D57ED0048A55', 'Node Echo',    'Block 2 — Buffer Zone', st_point(101.6299, 0.5502)::geography, st_point(101.6299, 0.5502)::geography, 'offline', 12, -110, 0.8, '1.3.9', now() - interval '54 minutes');

-- 6 hours of history per node at 5-minute intervals, with Charlie spiking
-- into an active chainsaw + tree-fall event in the most recent readings.
do $$
declare
  v_node record;
  v_t timestamptz;
  v_step interval := interval '5 minutes';
  v_start timestamptz := now() - interval '6 hours';
  v_acoustic numeric;
  v_tilt numeric;
  v_impact numeric;
  v_battery numeric;
begin
  for v_node in select id, forest_zone, battery_pct, current_location from public.nodes loop
    v_t := v_start;
    while v_t <= now() loop
      v_battery := greatest(10, v_node.battery_pct + (extract(epoch from (v_start - v_t)) / 3600.0) * 0.4);

      if v_node.id = '33333333-3333-4333-8333-333333333333' and v_t >= now() - interval '20 minutes' then
        v_acoustic := 0.6 + random() * 0.35;
        v_tilt := 12 + random() * 30;
        v_impact := 1.0 + random() * 2.2;
      else
        v_acoustic := random() * 0.12;
        v_tilt := random() * 3;
        v_impact := random() * 0.4;
      end if;

      insert into public.telemetry (
        node_id, recorded_at, location, battery_pct, rssi_dbm, snr_db,
        temperature_c, humidity_pct, tilt_deg, tilt_delta_deg, impact_g,
        acoustic_confidence, acoustic_db
      ) values (
        v_node.id, v_t, v_node.current_location, v_battery,
        -70 - floor(random() * 40)::int, 3 + random() * 8,
        24 + random() * 6, 65 + random() * 20,
        v_tilt, v_tilt * (random() - 0.5) * 0.2, v_impact,
        v_acoustic, 38 + v_acoustic * 55
      );

      v_t := v_t + v_step;
    end loop;
  end loop;
end $$;
