insert into public.charging_stations (
  id,
  provider,
  name,
  address,
  city,
  state,
  lat,
  lng,
  charger_count,
  charger_type
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'Tesla',
    'Tesla Supercharger - Austin South Congress',
    '1000 S Congress Ave',
    'Austin',
    'TX',
    30.2505,
    -97.7493,
    16,
    'NACS Supercharger'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Electrify America',
    'EA Downtown Market',
    '500 E 4th St',
    'Austin',
    'TX',
    30.2654,
    -97.7382,
    8,
    'CCS Fast Charger'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'ChargePoint',
    'ChargePoint Mueller Center',
    '1900 Aldrich St',
    'Austin',
    'TX',
    30.2983,
    -97.7062,
    10,
    'Level 2 / CCS'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Tesla',
    'Tesla Supercharger - Domain Northside',
    '11700 Domain Blvd',
    'Austin',
    'TX',
    30.4027,
    -97.7226,
    20,
    'NACS Supercharger'
  )
on conflict (id) do update set
  provider = excluded.provider,
  name = excluded.name,
  address = excluded.address,
  city = excluded.city,
  state = excluded.state,
  lat = excluded.lat,
  lng = excluded.lng,
  charger_count = excluded.charger_count,
  charger_type = excluded.charger_type;
