import Constants from "expo-constants";

type Extra = Record<string, string | undefined>;

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

function readEnv(name: string) {
  return process.env[name] ?? extra[name];
}

export const env = {
  supabaseUrl: readEnv("EXPO_PUBLIC_SUPABASE_URL") ?? "",
  supabaseAnonKey: readEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY") ?? "",
  mapboxToken: readEnv("EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN") ?? "",
  googleMapsApiKey: readEnv("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY") ?? "",
  stripePublishableKey: readEnv("EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY") ?? ""
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
