export type PresenceStatus =
  | "open_to_chat"
  | "watching_movie"
  | "working"
  | "road_tripping"
  | "networking"
  | "talking_tesla"
  | "do_not_disturb"
  | "adult_mode_available";

export type VisibilityMode = "standard" | "station_only" | "hidden" | "ghost";

export type InviteType =
  | "chat"
  | "movie"
  | "talk_ev"
  | "business"
  | "coffee"
  | "road_trip_tips"
  | "adult_private";

export type InviteStatus = "pending" | "accepted" | "declined" | "expired" | "canceled";

export type PresenceKind = "charging" | "on_the_way" | "recently_active";

export interface AppUser {
  id: string;
  email: string;
  is_18_plus: boolean;
  terms_accepted_at: string | null;
  phone_verified: boolean;
  identity_verified: boolean;
  banned: boolean;
}

export interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  interests: string[];
  adult_mode_enabled: boolean;
  visibility_mode: VisibilityMode;
  default_status: PresenceStatus | null;
  created_at?: string;
  updated_at?: string;
}

export interface ChargingStation {
  id: string;
  provider: string;
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  charger_count: number;
  charger_type: string;
  created_at?: string;
}

export interface StationPresence {
  presence_id: string;
  user_id: string;
  station_id: string;
  display_name: string;
  profile_photo_url: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  status: PresenceStatus;
  visibility: VisibilityMode;
  estimated_departure_at: string | null;
  started_at: string;
  interests: string[];
  presence_kind: PresenceKind;
  can_send_adult_invite: boolean;
}

export interface ArrivalIntent {
  id: string;
  user_id: string;
  station_id: string;
  eta_at: string;
  visibility: VisibilityMode;
  active: boolean;
  created_at: string;
}

export interface Invite {
  id: string;
  sender_id: string;
  recipient_id: string;
  station_id: string;
  invite_type: InviteType;
  message: string | null;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  invite_id: string;
  user_one_id: string;
  user_two_id: string;
  active: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  station_id: string | null;
  category: string;
  description: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
}

export interface SessionProfile {
  user: AppUser | null;
  profile: Profile | null;
}
