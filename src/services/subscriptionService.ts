import { premiumPlans } from "@/constants/options";

export function getPremiumPlans() {
  return premiumPlans;
}

export async function startCheckoutPlaceholder(planId: "monthly" | "yearly") {
  return {
    planId,
    status: "stubbed",
    message: "Stripe Checkout is wired as a Phase 2 integration placeholder."
  };
}
