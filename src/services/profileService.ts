import { supabase, requireSupabaseConfig } from "@/lib/supabase";
import { onboardingSchema, type OnboardingInput } from "@/lib/validation";
import type { Profile, VisibilityMode } from "@/types/domain";

function normalizeAdultInterests(input: OnboardingInput) {
  if (input.adult_mode_enabled) return input.interests;
  return input.interests.filter((interest) => interest !== "Adult connection");
}

async function uploadProfilePhoto(userId: string, uri?: string | null) {
  if (!uri) return null;
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;

  const response = await fetch(uri);
  const blob = await response.blob();
  const extension = blob.type?.split("/")[1] || "jpg";
  const path = `${userId}/profile-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from("profile-photos").upload(path, blob, {
    upsert: true,
    contentType: blob.type || "image/jpeg"
  });

  if (error) throw error;

  const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function upsertProfile(userId: string, input: OnboardingInput) {
  requireSupabaseConfig();
  const parsed = onboardingSchema.parse(input);
  const profilePhotoUrl = await uploadProfilePhoto(userId, parsed.profile_photo_url);

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      display_name: parsed.display_name,
      bio: parsed.bio ?? null,
      profile_photo_url: profilePhotoUrl,
      vehicle_make: parsed.vehicle_make,
      vehicle_model: parsed.vehicle_model,
      vehicle_color: parsed.vehicle_color,
      interests: normalizeAdultInterests(parsed),
      adult_mode_enabled: parsed.adult_mode_enabled,
      visibility_mode: parsed.visibility_mode,
      default_status: parsed.default_status
    })
    .select("*")
    .single<Profile>();

  if (error) throw error;
  return data;
}

export async function updateAdultMode(enabled: boolean, consentAccepted: boolean) {
  requireSupabaseConfig();
  if (enabled && !consentAccepted) {
    throw new Error("Private Intent (18+) requires explicit consent.");
  }

  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Authentication required.");

  const updates: Partial<Profile> = { adult_mode_enabled: enabled };

  if (!enabled) {
    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("interests")
      .eq("id", userId)
      .single<Pick<Profile, "interests">>();

    if (profileError) throw profileError;

    updates.default_status = "open_to_chat";
    updates.interests = currentProfile.interests.filter((interest) => interest !== "Adult connection");
  }

  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select("*").single<Profile>();
  if (error) throw error;
  return data;
}

export async function updateVisibility(visibilityMode: VisibilityMode) {
  requireSupabaseConfig();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Authentication required.");

  const { data, error } = await supabase
    .from("profiles")
    .update({ visibility_mode: visibilityMode })
    .eq("id", userId)
    .select("*")
    .single<Profile>();

  if (error) throw error;
  return data;
}
