import { describe, expect, it } from "vitest";

import { hasExplicitPublicContent, onboardingSchema } from "@/lib/validation";

const baseOnboarding = {
  display_name: "Jordan",
  bio: "EV enthusiast",
  profile_photo_url: "",
  vehicle_make: "Tesla",
  vehicle_model: "Model 3",
  vehicle_color: "White",
  interests: ["EVs"],
  adult_mode_enabled: false,
  visibility_mode: "standard",
  default_status: "open_to_chat"
};

describe("onboardingSchema", () => {
  it("accepts a valid profile", () => {
    expect(onboardingSchema.safeParse(baseOnboarding).success).toBe(true);
  });

  it("rejects a display name that is too long", () => {
    const result = onboardingSchema.safeParse({
      ...baseOnboarding,
      display_name: "x".repeat(49)
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty display name", () => {
    const result = onboardingSchema.safeParse({ ...baseOnboarding, display_name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects explicit content in the display name", () => {
    const result = onboardingSchema.safeParse({ ...baseOnboarding, display_name: "xxx" });
    expect(result.success).toBe(false);
  });

  it("requires adult mode consent when adult mode is enabled", () => {
    const result = onboardingSchema.safeParse({
      ...baseOnboarding,
      adult_mode_enabled: true,
      adult_mode_consent: false
    });
    expect(result.success).toBe(false);
  });

  it("allows adult mode when consent is given", () => {
    const result = onboardingSchema.safeParse({
      ...baseOnboarding,
      adult_mode_enabled: true,
      adult_mode_consent: true
    });
    expect(result.success).toBe(true);
  });
});

describe("hasExplicitPublicContent", () => {
  it("flags explicit terms", () => {
    expect(hasExplicitPublicContent("looking for a hookup")).toBe(true);
  });

  it("allows clean text", () => {
    expect(hasExplicitPublicContent("Looking to talk Tesla and EVs")).toBe(false);
  });
});
