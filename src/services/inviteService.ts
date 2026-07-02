import { supabase, requireSupabaseConfig } from "@/lib/supabase";
import { inviteSchema, type InviteInput } from "@/lib/validation";
import type { Chat, Invite, InviteStatus } from "@/types/domain";

export async function sendInvite(input: InviteInput) {
  requireSupabaseConfig();
  const parsed = inviteSchema.parse(input);

  const { data, error } = await supabase.rpc("send_invite", {
    p_recipient_id: parsed.recipient_id,
    p_station_id: parsed.station_id,
    p_invite_type: parsed.invite_type,
    p_message: parsed.message ?? null
  });

  if (error) throw error;
  return data as Invite;
}

export async function fetchInvites() {
  const { data, error } = await supabase.from("invites").select("*").order("created_at", { ascending: false }).returns<Invite[]>();
  if (error) throw error;
  return data ?? [];
}

export async function acceptInvite(inviteId: string) {
  requireSupabaseConfig();
  const { data, error } = await supabase.rpc("accept_invite", { p_invite_id: inviteId });
  if (error) throw error;
  return data as Chat;
}

export async function updateInviteStatus(inviteId: string, status: Extract<InviteStatus, "declined" | "canceled">) {
  requireSupabaseConfig();
  const { data, error } = await supabase.from("invites").update({ status }).eq("id", inviteId).select("*").single<Invite>();
  if (error) throw error;
  return data;
}

export async function expireInvites() {
  const { data, error } = await supabase.rpc("expire_invites");
  if (error) throw error;
  return data as number;
}
