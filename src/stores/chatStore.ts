import { create } from "zustand";

import * as chatService from "@/services/chatService";
import type { MessageInput } from "@/lib/validation";
import type { Chat, Message } from "@/types/domain";

interface ChatState {
  chats: Chat[];
  messagesByChat: Record<string, Message[]>;
  loading: boolean;
  error: string | null;
  loadChats: () => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (input: MessageInput) => Promise<void>;
  endChat: (chatId: string) => Promise<void>;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Chat action failed.";
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messagesByChat: {},
  loading: false,
  error: null,

  async loadChats() {
    set({ loading: true, error: null });
    try {
      const chats = await chatService.fetchChats();
      set({ chats, loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  async loadMessages(chatId) {
    set({ loading: true, error: null });
    try {
      const messages = await chatService.fetchMessages(chatId);
      set({ messagesByChat: { ...get().messagesByChat, [chatId]: messages }, loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  async sendMessage(input) {
    set({ loading: true, error: null });
    try {
      const message = await chatService.sendMessage(input);
      const currentMessages = get().messagesByChat[input.chat_id] ?? [];
      set({
        messagesByChat: { ...get().messagesByChat, [input.chat_id]: [...currentMessages, message] },
        loading: false
      });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  async endChat(chatId) {
    set({ loading: true, error: null });
    try {
      await chatService.endChat(chatId);
      set({ chats: get().chats.map((chat) => (chat.id === chatId ? { ...chat, active: false } : chat)), loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  }
}));
