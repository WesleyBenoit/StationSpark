import { demoPresence, demoStations } from "@/services/demoData";
import { supabase, requireSupabaseConfig } from "@/lib/supabase";
import { arrivalIntentSchema, checkInSchema, type ArrivalIntentInput, type CheckInInput } from "@/lib/validation";
import type { ChargingStation, StationPresence } from "@/types/domain";
import type { StationSummary } from "@/components/StationCard";

export async function fetchStations() {
  const { data, error } = await supabase
    .from("charging_stations")
    .select("*")
    .order("name")
    .returns<ChargingStation[]>();

  if (error || !data?.length) return demoStations;
  return data;
}

export async function fetchStationSummaries() {
  const { data, error } = await supabase.from("station_activity_summary").select("*").returns<StationSummary[]>();
  if (error || !data) return [];
  return data;
}

export async function fetchStationPresence(stationId: string) {
  const [{ data: charging, error: chargingError }, { data: arrivals, error: arrivalsError }] = await Promise.all([
    supabase.from("station_presence_public").select("*").eq("station_id", stationId).returns<StationPresence[]>(),
    supabase.from("arrival_intents_public").select("*").eq("station_id", stationId).returns<StationPresence[]>()
  ]);

  if (chargingError || arrivalsError) {
    return demoPresence.filter((presence) => presence.station_id === stationId);
  }

  return [...(charging ?? []), ...(arrivals ?? [])];
}

export async function checkIn(input: CheckInInput) {
  requireSupabaseConfig();
  const parsed = checkInSchema.parse(input);
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Authentication required.");

  await checkOutActive();

  const estimatedDeparture = new Date(Date.now() + parsed.estimated_minutes_remaining * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("check_ins")
    .insert({
      user_id: userId,
      station_id: parsed.station_id,
      status: parsed.status,
      visibility: parsed.visibility,
      estimated_departure_at: estimatedDeparture
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function checkOutActive() {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return;

  const { error } = await supabase
    .from("check_ins")
    .update({ active: false, ended_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("active", true);

  if (error) throw error;
}

export async function markOnTheWay(input: ArrivalIntentInput) {
  requireSupabaseConfig();
  const parsed = arrivalIntentSchema.parse(input);
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Authentication required.");

  await supabase.from("arrival_intents").update({ active: false }).eq("user_id", userId).eq("active", true);

  const { data, error } = await supabase
    .from("arrival_intents")
    .insert({
      user_id: userId,
      station_id: parsed.station_id,
      eta_at: new Date(Date.now() + parsed.eta_minutes * 60 * 1000).toISOString(),
      visibility: parsed.visibility
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
