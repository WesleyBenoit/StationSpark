import Constants from "expo-constants";
import { z } from "zod";

/**
 * Typed, validated access to public runtime configuration.
 *
 * All values come from `EXPO_PUBLIC_*` variables (inlined at build time) with a
 * fallback to `expo.extra`. Validation is non-throwing: the app can still boot
 * in a partially-configured state (e.g. local development without Supabase),
 * but `getEnvDiagnostics()` surfaces exactly what is missing or malformed so
 * that startup can log a clear, actionable warning.
 */

type RawExtra = Record<string, string | undefined>;

const extra = (Constants.expoConfig?.extra ?? {}) as RawExtra;

function readEnv(name: string) {
  return process.env[name] ?? extra[name];
}

const optionalUrl = z.string().url().optional().or(z.literal("").transform(() => undefined));
const optionalString = z.string().min(1).optional().or(z.literal("").transform(() => undefined));

const envSchema = z.object({
  supabaseUrl: optionalUrl,
  supabaseAnonKey: optionalString,
  mapboxToken: optionalString,
  googleMapsApiKey: optionalString,
  stripePublishableKey: optionalString
});

export type Env = z.infer<typeof envSchema>;

const rawEnv = {
  supabaseUrl: readEnv("EXPO_PUBLIC_SUPABASE_URL") ?? "",
  supabaseAnonKey: readEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY") ?? "",
  mapboxToken: readEnv("EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN") ?? "",
  googleMapsApiKey: readEnv("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY") ?? "",
  stripePublishableKey: readEnv("EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY") ?? ""
};

const parsed = envSchema.safeParse(rawEnv);

/**
 * Validated environment. Invalid or empty optional values normalize to `""`
 * so existing string-based checks (`env.mapboxToken`, `if (env.supabaseUrl)`)
 * keep working unchanged.
 */
export const env = {
  supabaseUrl: parsed.success ? parsed.data.supabaseUrl ?? "" : "",
  supabaseAnonKey: parsed.success ? parsed.data.supabaseAnonKey ?? "" : "",
  mapboxToken: parsed.success ? parsed.data.mapboxToken ?? "" : rawEnv.mapboxToken,
  googleMapsApiKey: parsed.success ? parsed.data.googleMapsApiKey ?? "" : rawEnv.googleMapsApiKey,
  stripePublishableKey: parsed.success
    ? parsed.data.stripePublishableKey ?? ""
    : rawEnv.stripePublishableKey
} as const;

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

export interface EnvDiagnostics {
  ok: boolean;
  /** Human-readable problems, e.g. "EXPO_PUBLIC_SUPABASE_URL is not a valid URL". */
  issues: string[];
  /** Optional features that are unconfigured and therefore disabled. */
  disabledFeatures: string[];
}

const fieldToVar: Record<keyof Env, string> = {
  supabaseUrl: "EXPO_PUBLIC_SUPABASE_URL",
  supabaseAnonKey: "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  mapboxToken: "EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN",
  googleMapsApiKey: "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY",
  stripePublishableKey: "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY"
};

/**
 * Report malformed values and unconfigured optional features. Pure and
 * side-effect free so it can be unit tested and called from a startup log.
 */
export function getEnvDiagnostics(): EnvDiagnostics {
  const issues: string[] = [];

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof Env | undefined;
      const varName = field ? fieldToVar[field] : "environment";
      issues.push(`${varName}: ${issue.message}`);
    }
  }

  if (!env.supabaseUrl) issues.push(`${fieldToVar.supabaseUrl} is required for authentication and data.`);
  if (!env.supabaseAnonKey) issues.push(`${fieldToVar.supabaseAnonKey} is required for authentication and data.`);

  const disabledFeatures: string[] = [];
  if (!env.mapboxToken) disabledFeatures.push("Mapbox map (falls back to react-native-maps)");
  if (!env.stripePublishableKey) disabledFeatures.push("Stripe checkout (premium tier)");

  return {
    ok: Boolean(env.supabaseUrl && env.supabaseAnonKey) && parsed.success,
    issues,
    disabledFeatures
  };
}
