import { z } from "zod";

import {
  adultInviteType,
  adultPresenceStatus,
  interestOptions,
  inviteTypes,
  presenceStatuses,
  visibilityModes
} from "@/constants/options";

const explicitPublicContentPattern = /\b(hookup|sex|nude|nsfw|fetish|escort|xxx)\b/i;
const allPresenceStatuses = [...presenceStatuses, adultPresenceStatus] as const;
const allInviteTypes = [...inviteTypes, adultInviteType] as const;

export function hasExplicitPublicContent(value?: string | null) {
  return Boolean(value && explicitPublicContentPattern.test(value));
}

function publicText(options: { min?: number; max: number }) {
  return z
    .string()
    .trim()
    .min(options.min ?? 0)
    .max(options.max)
    .refine((value) => !hasExplicitPublicContent(value), {
      message: "Public profile fields cannot include explicit adult content."
    });
}

export const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8)
});

export const signUpSchema = signInSchema.extend({
  is18Plus: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you are 18+ to use StationSpark." })
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and safety policy." })
  })
});

export const onboardingSchema = z.object({
  display_name: publicText({ min: 1, max: 48 }),
  bio: publicText({ max: 180 }).optional(),
  profile_photo_url: z.string().url().optional().or(z.literal("")),
  vehicle_make: z.string().trim().min(1).max(32),
  vehicle_model: z.string().trim().min(1).max(48),
  vehicle_color: z.string().trim().min(1).max(32),
  interests: z.array(z.enum(interestOptions)).min(1).max(8),
  adult_mode_enabled: z.boolean().default(false),
  adult_mode_consent: z.boolean().optional(),
  visibility_mode: z.enum(visibilityModes).default("standard"),
  default_status: z.enum(allPresenceStatuses).default("open_to_chat")
}).superRefine((value, context) => {
  if (value.adult_mode_enabled && value.adult_mode_consent !== true) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["adult_mode_consent"],
      message: "Adult Mode requires separate opt-in consent."
    });
  }
});

export const checkInSchema = z.object({
  station_id: z.string().uuid(),
  status: z.enum(allPresenceStatuses),
  visibility: z.enum(visibilityModes),
  estimated_minutes_remaining: z.number().int().min(5).max(240)
});

export const arrivalIntentSchema = z.object({
  station_id: z.string().uuid(),
  eta_minutes: z.number().int().min(1).max(180),
  visibility: z.enum(visibilityModes).default("standard")
});

export const inviteSchema = z.object({
  recipient_id: z.string().uuid(),
  station_id: z.string().uuid(),
  invite_type: z.enum(allInviteTypes),
  message: z.string().trim().max(180).optional()
});

export const messageSchema = z.object({
  chat_id: z.string().uuid(),
  body: z.string().trim().min(1).max(1000)
});

export const reportSchema = z.object({
  reported_user_id: z.string().uuid(),
  station_id: z.string().uuid().optional(),
  category: z.enum(["harassment", "safety", "spam", "explicit_public_content", "impersonation", "other"]),
  description: z.string().trim().min(8).max(1000)
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type ArrivalIntentInput = z.infer<typeof arrivalIntentSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
