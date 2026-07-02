import type { ChargingStation, Invite, Message, StationPresence } from "@/types/domain";

export const demoStations: ChargingStation[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    provider: "Tesla",
    name: "Tesla Supercharger - Austin South Congress",
    address: "1000 S Congress Ave",
    city: "Austin",
    state: "TX",
    lat: 30.2505,
    lng: -97.7493,
    charger_count: 16,
    charger_type: "NACS Supercharger"
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    provider: "Electrify America",
    name: "EA Downtown Market",
    address: "500 E 4th St",
    city: "Austin",
    state: "TX",
    lat: 30.2654,
    lng: -97.7382,
    charger_count: 8,
    charger_type: "CCS Fast Charger"
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    provider: "ChargePoint",
    name: "ChargePoint Mueller Center",
    address: "1900 Aldrich St",
    city: "Austin",
    state: "TX",
    lat: 30.2983,
    lng: -97.7062,
    charger_count: 10,
    charger_type: "Level 2 / CCS"
  }
];

export const demoPresence: StationPresence[] = [
  {
    presence_id: "presence-1",
    user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    station_id: "11111111-1111-4111-8111-111111111111",
    display_name: "Maya",
    profile_photo_url: null,
    vehicle_make: "Tesla",
    vehicle_model: "Model Y",
    vehicle_color: "Pearl white",
    status: "open_to_chat",
    visibility: "standard",
    estimated_departure_at: new Date(Date.now() + 22 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    interests: ["Tesla", "Road trips", "Coffee"],
    presence_kind: "charging",
    can_send_adult_invite: false
  },
  {
    presence_id: "presence-2",
    user_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    station_id: "11111111-1111-4111-8111-111111111111",
    display_name: "Jordan",
    profile_photo_url: null,
    vehicle_make: "Rivian",
    vehicle_model: "R1T",
    vehicle_color: "Forest green",
    status: "networking",
    visibility: "station_only",
    estimated_departure_at: new Date(Date.now() + 38 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    interests: ["EVs", "Business", "Networking"],
    presence_kind: "charging",
    can_send_adult_invite: false
  },
  {
    presence_id: "presence-3",
    user_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    station_id: "22222222-2222-4222-8222-222222222222",
    display_name: "Sam",
    profile_photo_url: null,
    vehicle_make: "Hyundai",
    vehicle_model: "Ioniq 5",
    vehicle_color: "Matte gray",
    status: "road_tripping",
    visibility: "standard",
    estimated_departure_at: new Date(Date.now() + 14 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    interests: ["Road trips", "Food", "Movies"],
    presence_kind: "on_the_way",
    can_send_adult_invite: false
  }
];

export const demoInvites: Invite[] = [];
export const demoMessages: Message[] = [];
