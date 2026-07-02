import { supabase, requireSupabaseConfig } from "@/lib/supabase";
import { messageSchema, type MessageInput } from "@/lib/validation";
import type { Chat, Message } from "@/types/domain";

export async function fetchChats() {
  const { data, error } = await supabase.from("chats").select("*").order("created_at", { ascending: false }).returns<Chat[]>();
  if (error) throw error;
  return data ?? [];
}

export async function fetchChatByInvite(inviteId: string) {
  const { data, error } = await supabase.from("chats").select("*").eq("invite_id", inviteId).maybeSingle<Chat>();
  if (error) throw error;
  return data;
}

export async function fetchMessages(chatId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .returns<Message[]>();

  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(input: MessageInput) {
  requireSupabaseConfig();
  const parsed = messageSchema.parse(input);
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Authentication required.");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: parsed.chat_id,
      sender_id: userId,
      body: parsed.body
    })
    .select("*")
    .single<Message>();

  if (error) throw error;
  return data;
}

export async function endChat(chatId: string) {
  requireSupabaseConfig();
  const { data, error } = await supabase.from("chats").update({ active: false }).eq("id", chatId).select("*").single<Chat>();
  if (error) throw error;
  return data;
}

export function subscribeToMessages(chatId: string, onMessage: (message: Message) => void) {
  return supabase
    .channel(`chat:${chatId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`
      },
      (payload) => onMessage(payload.new as Message)
    )
    .subscribe();
}
