import { create } from "zustand";

import * as safetyService from "@/services/safetyService";
import type { ReportInput } from "@/lib/validation";
import type { Block } from "@/types/domain";

interface SafetyState {
  blocks: Block[];
  loading: boolean;
  error: string | null;
  loadBlocks: () => Promise<void>;
  blockUser: (blockedUserId: string) => Promise<void>;
  unblockUser: (blockedUserId: string) => Promise<void>;
  reportUser: (input: ReportInput) => Promise<void>;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Safety action failed.";
}

export const useSafetyStore = create<SafetyState>((set, get) => ({
  blocks: [],
  loading: false,
  error: null,

  async loadBlocks() {
    set({ loading: true, error: null });
    try {
      const blocks = await safetyService.fetchBlocks();
      set({ blocks, loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  async blockUser(blockedUserId) {
    set({ loading: true, error: null });
    try {
      const block = await safetyService.blockUser(blockedUserId);
      set({ blocks: [block, ...get().blocks], loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  async unblockUser(blockedUserId) {
    set({ loading: true, error: null });
    try {
      await safetyService.unblockUser(blockedUserId);
      set({ blocks: get().blocks.filter((block) => block.blocked_id !== blockedUserId), loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  async reportUser(input) {
    set({ loading: true, error: null });
    try {
      await safetyService.reportUser(input);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  }
}));
