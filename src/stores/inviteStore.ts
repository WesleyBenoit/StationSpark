import { create } from "zustand";

import * as inviteService from "@/services/inviteService";
import type { InviteInput } from "@/lib/validation";
import type { Chat, Invite } from "@/types/domain";

interface InviteState {
  invites: Invite[];
  loading: boolean;
  error: string | null;
  loadInvites: () => Promise<void>;
  sendInvite: (input: InviteInput) => Promise<Invite>;
  acceptInvite: (inviteId: string) => Promise<Chat>;
  declineInvite: (inviteId: string) => Promise<void>;
  cancelInvite: (inviteId: string) => Promise<void>;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Invite action failed.";
}

export const useInviteStore = create<InviteState>((set, get) => ({
  invites: [],
  loading: false,
  error: null,

  async loadInvites() {
    set({ loading: true, error: null });
    try {
      await inviteService.expireInvites().catch(() => undefined);
      const invites = await inviteService.fetchInvites();
      set({ invites, loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  async sendInvite(input) {
    set({ loading: true, error: null });
    try {
      const invite = await inviteService.sendInvite(input);
      set({ invites: [invite, ...get().invites], loading: false });
      return invite;
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  async acceptInvite(inviteId) {
    set({ loading: true, error: null });
    try {
      const chat = await inviteService.acceptInvite(inviteId);
      await get().loadInvites();
      set({ loading: false });
      return chat;
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  async declineInvite(inviteId) {
    set({ loading: true, error: null });
    try {
      await inviteService.updateInviteStatus(inviteId, "declined");
      await get().loadInvites();
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  async cancelInvite(inviteId) {
    set({ loading: true, error: null });
    try {
      await inviteService.updateInviteStatus(inviteId, "canceled");
      await get().loadInvites();
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  }
}));
