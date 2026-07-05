import { adultInviteType } from "@/constants/options";
import type { Invite, InviteType, Profile, StationPresence } from "@/types/domain";

export interface UserPolicyState {
  userId: string;
  is18Plus: boolean;
  adultModeEnabled: boolean;
  termsAccepted?: boolean;
  banned?: boolean;
}

export interface BlockRelation {
  blocker_id: string;
  blocked_id: string;
}

export function isBlockedBetween(
  firstUserId: string,
  secondUserId: string,
  blocks: BlockRelation[] = []
) {
  return blocks.some(
    (block) =>
      (block.blocker_id === firstUserId && block.blocked_id === secondUserId) ||
      (block.blocker_id === secondUserId && block.blocked_id === firstUserId)
  );
}

export function canSeeUser(
  viewerId: string,
  subjectId: string,
  blocks: BlockRelation[] = []
) {
  return viewerId === subjectId || !isBlockedBetween(viewerId, subjectId, blocks);
}

export function canPairForAdultMode(viewer: UserPolicyState, subject: UserPolicyState) {
  return (
    canUseApp(viewer) &&
    canUseApp(subject) &&
    viewer.adultModeEnabled &&
    subject.adultModeEnabled
  );
}

export function canUseApp(user: UserPolicyState) {
  return user.is18Plus && user.termsAccepted !== false && !user.banned;
}

export function isAdultInviteType(inviteType: InviteType) {
  return inviteType === adultInviteType;
}

export function canSendInvite(params: {
  sender: UserPolicyState;
  recipient: UserPolicyState;
  inviteType: InviteType;
  blocks?: BlockRelation[];
}) {
  const { sender, recipient, inviteType, blocks = [] } = params;

  if (sender.userId === recipient.userId) return false;
  if (!canUseApp(sender) || !canUseApp(recipient)) return false;
  if (isBlockedBetween(sender.userId, recipient.userId, blocks)) return false;
  if (isAdultInviteType(inviteType)) return canPairForAdultMode(sender, recipient);

  return true;
}

export function isInviteExpired(invite: Pick<Invite, "expires_at" | "status">, now = new Date()) {
  return invite.status === "pending" && new Date(invite.expires_at).getTime() <= now.getTime();
}

export function canOpenChat(params: {
  currentUserId: string;
  invite: Pick<Invite, "sender_id" | "recipient_id" | "status" | "expires_at">;
  blocks?: BlockRelation[];
}) {
  const { currentUserId, invite, blocks = [] } = params;
  const isParticipant = currentUserId === invite.sender_id || currentUserId === invite.recipient_id;

  if (!isParticipant) return false;
  if (isBlockedBetween(invite.sender_id, invite.recipient_id, blocks)) return false;
  if (invite.status !== "accepted") return false;

  return true;
}

export function getVisibleInterests(params: {
  viewer: UserPolicyState;
  subject: UserPolicyState;
  interests: string[];
}) {
  const { viewer, subject, interests } = params;

  if (canPairForAdultMode(viewer, subject)) return interests;
  return interests.filter((interest) => interest !== "Adult connection");
}

export function canUseAdultStatus(profile: Pick<Profile, "adult_mode_enabled">, is18Plus: boolean) {
  return is18Plus && profile.adult_mode_enabled;
}

export function sanitizePresenceForViewer(params: {
  viewer: UserPolicyState;
  subject: UserPolicyState;
  presence: StationPresence;
}): StationPresence {
  const { viewer, subject, presence } = params;
  const adultVisible = canPairForAdultMode(viewer, subject);

  return {
    ...presence,
    status: adultVisible && presence.status === "adult_mode_available" ? presence.status : "open_to_chat",
    interests: getVisibleInterests({ viewer, subject, interests: presence.interests }),
    can_send_adult_invite: adultVisible
  };
}
