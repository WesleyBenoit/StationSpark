import type { InviteType, PresenceStatus, VisibilityMode } from "@/types/domain";

export const interestOptions = [
  "Tesla",
  "EVs",
  "Road trips",
  "Business",
  "Investing",
  "Movies",
  "Gaming",
  "Coffee",
  "Food",
  "Fitness",
  "Parents",
  "Pets",
  "Car mods",
  "Networking",
  "Casual conversation",
  "Adult connection"
] as const;

export const publicInterestOptions = interestOptions.filter(
  (interest) => interest !== "Adult connection"
);

export const presenceStatuses = [
  "open_to_chat",
  "watching_movie",
  "working",
  "road_tripping",
  "networking",
  "talking_tesla",
  "do_not_disturb"
] as const satisfies readonly PresenceStatus[];

export const adultPresenceStatus: PresenceStatus = "adult_mode_available";

export const visibilityModes = ["standard", "station_only", "hidden", "ghost"] as const satisfies readonly VisibilityMode[];

export const inviteTypes = [
  "chat",
  "movie",
  "talk_ev",
  "business",
  "coffee",
  "road_trip_tips"
] as const satisfies readonly InviteType[];

export const adultInviteType: InviteType = "adult_private";

export const premiumPlans = [
  {
    id: "monthly",
    title: "Premium Monthly",
    price: "$7.99/month",
    features: ["Unlimited invites", "Advanced filters", "Ghost Mode", "Profile boost"]
  },
  {
    id: "yearly",
    title: "Premium Yearly",
    price: "$59.99/year",
    features: ["Best value", "Verification badge placeholder", "Longer chat history"]
  }
] as const;

export const statusLabels: Record<PresenceStatus, string> = {
  open_to_chat: "Open to chat",
  watching_movie: "Watching a movie",
  working: "Working",
  road_tripping: "Road tripping",
  networking: "Networking",
  talking_tesla: "Talking Tesla",
  do_not_disturb: "Do not disturb",
  adult_mode_available: "Private Intent (18+)"
};

export const inviteLabels: Record<InviteType, string> = {
  chat: "Chat while charging",
  movie: "Watch a movie",
  talk_ev: "Talk Tesla / EVs",
  business: "Business networking",
  coffee: "Grab coffee nearby",
  road_trip_tips: "Road trip tips",
  adult_private: "Private Intent invite"
};
