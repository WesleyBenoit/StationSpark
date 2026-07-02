import type { Session } from "@supabase/supabase-js";

import { supabase, requireSupabaseConfig } from "@/lib/supabase";
import { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from "@/lib/validation";
import type { AppUser, Profile, SessionProfile } from "@/types/domain";

export async function signUp(input: SignUpInput) {
  requireSupabaseConfig();
  const parsed = signUpSchema.parse(input);

  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      data: {
        is_18_plus: parsed.is18Plus,
        terms_accepted: parsed.termsAccepted
      }
    }
  });

  if (error) throw error;
  return data;
}

export async function signIn(input: SignInInput) {
  requireSupabaseConfig();
  const parsed = signInSchema.parse(input);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  requireSupabaseConfig();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getSessionProfile(session?: Session | null): Promise<SessionProfile> {
  const activeSession = session ?? (await getSession());

  if (!activeSession?.user) {
    return { user: null, profile: null };
  }

  const [{ data: user, error: userError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from("users").select("*").eq("id", activeSession.user.id).single<AppUser>(),
    supabase.from("profiles").select("*").eq("id", activeSession.user.id).maybeSingle<Profile>()
  ]);

  if (userError) throw userError;
  if (profileError) throw profileError;

  return { user, profile: profile ?? null };
}

export async function requestOAuthPlaceholder(provider: "google" | "apple") {
  throw new Error(`${provider} auth is stubbed for the MVP. Configure Supabase OAuth before enabling it.`);
}

export async function requestPhoneVerificationPlaceholder() {
  throw new Error("Phone verification is stubbed for the MVP. Configure Supabase phone auth before enabling it.");
}
