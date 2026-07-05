import { describe, expect, it, vi } from "vitest";

// expo-constants transitively imports react-native (Flow syntax), which the
// test bundler can't parse. Stub it with an empty extra so env.ts reads only
// from process.env — none of which are set in the test runner.
vi.mock("expo-constants", () => ({ default: { expoConfig: { extra: {} } } }));

const { getEnvDiagnostics, isSupabaseConfigured } = await import("@/lib/env");

// The test runner sets no EXPO_PUBLIC_* variables, so this exercises the
// unconfigured path: Supabase is required and missing; optional features off.
describe("getEnvDiagnostics (unconfigured)", () => {
  it("reports Supabase as not configured", () => {
    expect(isSupabaseConfigured).toBe(false);
  });

  it("flags the required Supabase variables as issues", () => {
    const diagnostics = getEnvDiagnostics();
    expect(diagnostics.ok).toBe(false);
    expect(diagnostics.issues.join(" ")).toContain("EXPO_PUBLIC_SUPABASE_URL");
    expect(diagnostics.issues.join(" ")).toContain("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("lists optional features as disabled rather than errors", () => {
    const diagnostics = getEnvDiagnostics();
    expect(diagnostics.disabledFeatures.some((feature) => feature.includes("Mapbox"))).toBe(true);
    expect(diagnostics.disabledFeatures.some((feature) => feature.includes("Stripe"))).toBe(true);
  });
});
