import { create } from "zustand";

import { isSupabaseConfigured } from "@/lib/env";
import * as authService from "@/services/authService";
import * as profileService from "@/services/profileService";
import type { OnboardingInput, SignInInput, SignUpInput } from "@/lib/validation";
import type { AppUser, Profile } from "@/types/domain";

interface AuthState {
  user: AppUser | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (input: SignInInput) => Promise<void>;
  register: (input: SignUpInput) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (input: OnboardingInput) => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  async bootstrap() {
    if (!isSupabaseConfigured) {
      set({ loading: false, error: null });
      return;
    }

    try {
      const sessionProfile = await authService.getSessionProfile();
      set({ ...sessionProfile, loading: false, error: null });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  async login(input) {
    set({ loading: true, error: null });
    try {
      const { session } = await authService.signIn(input);
      const sessionProfile = await authService.getSessionProfile(session);
      set({ ...sessionProfile, loading: false, error: null });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  async register(input) {
    set({ loading: true, error: null });
    try {
      const { session } = await authService.signUp(input);
      const sessionProfile = await authService.getSessionProfile(session);
      set({ ...sessionProfile, loading: false, error: null });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  async logout() {
    set({ loading: true, error: null });
    try {
      await authService.signOut();
      set({ user: null, profile: null, loading: false, error: null });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  async completeOnboarding(input) {
    const userId = get().user?.id;
    if (!userId) throw new Error("Authentication required.");

    set({ loading: true, error: null });
    try {
      const profile = await profileService.upsertProfile(userId, input);
      set({ profile, loading: false, error: null });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  async refreshProfile() {
    if (!isSupabaseConfigured) return;
    const sessionProfile = await authService.getSessionProfile();
    set(sessionProfile);
  },

  setProfile(profile) {
    set({ profile });
  }
}));
