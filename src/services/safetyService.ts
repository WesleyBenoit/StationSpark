import { supabase, requireSupabaseConfig } from "@/lib/supabase";
import { reportSchema, type ReportInput } from "@/lib/validation";
import type { Block, Report } from "@/types/domain";

export async function fetchBlocks() {
  const { data, error } = await supabase.from("blocks").select("*").order("created_at", { ascending: false }).returns<Block[]>();
  if (error) throw error;
  return data ?? [];
}

export async function blockUser(blockedUserId: string) {
  requireSupabaseConfig();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Authentication required.");

  const { data, error } = await supabase
    .from("blocks")
    .upsert({ blocker_id: userId, blocked_id: blockedUserId }, { onConflict: "blocker_id,blocked_id" })
    .select("*")
    .single<Block>();

  if (error) throw error;
  return data;
}

export async function unblockUser(blockedUserId: string) {
  requireSupabaseConfig();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Authentication required.");

  const { error } = await supabase.from("blocks").delete().eq("blocker_id", userId).eq("blocked_id", blockedUserId);
  if (error) throw error;
}

export async function reportUser(input: ReportInput) {
  requireSupabaseConfig();
  const parsed = reportSchema.parse(input);
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Authentication required.");

  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: userId,
      reported_user_id: parsed.reported_user_id,
      station_id: parsed.station_id ?? null,
      category: parsed.category,
      description: parsed.description
    })
    .select("*")
    .single<Report>();

  if (error) throw error;
  return data;
}
