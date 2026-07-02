import { describe, expect, it } from "vitest";

import {
  canOpenChat,
  canSeeUser,
  canSendInvite,
  getVisibleInterests,
  isBlockedBetween,
  isInviteExpired
} from "@/lib/policies";
import type { Invite } from "@/types/domain";

const baseUser = {
  is18Plus: true,
  adultModeEnabled: false,
  banned: false
};

describe("adult mode visibility", () => {
  it("hides adult interests unless both users enabled adult mode", () => {
    const interests = ["EVs", "Adult connections", "Coffee"];
    const visible = getVisibleInterests({
      viewer: { ...baseUser, userId: "viewer", adultModeEnabled: true },
      subject: { ...baseUser, userId: "subject", adultModeEnabled: false },
      interests
    });

    expect(visible).toEqual(["EVs", "Coffee"]);
  });

  it("shows adult interests only when both users are 18+ and opted in", () => {
    const interests = ["EVs", "Adult connections"];
    const visible = getVisibleInterests({
      viewer: { ...baseUser, userId: "viewer", adultModeEnabled: true },
      subject: { ...baseUser, userId: "subject", adultModeEnabled: true },
      interests
    });

    expect(visible).toEqual(interests);
  });
});

describe("invite gating", () => {
  it("allows standard invites between unblocked adult users", () => {
    expect(
      canSendInvite({
        sender: { ...baseUser, userId: "sender" },
        recipient: { ...baseUser, userId: "recipient" },
        inviteType: "coffee"
      })
    ).toBe(true);
  });

  it("blocks invites when terms are not accepted", () => {
    expect(
      canSendInvite({
        sender: { ...baseUser, userId: "sender", termsAccepted: false },
        recipient: { ...baseUser, userId: "recipient" },
        inviteType: "chat"
      })
    ).toBe(false);
  });

  it("blocks adult private invites unless both users enabled Adult Mode", () => {
    expect(
      canSendInvite({
        sender: { ...baseUser, userId: "sender", adultModeEnabled: true },
        recipient: { ...baseUser, userId: "recipient", adultModeEnabled: false },
        inviteType: "adult_private"
      })
    ).toBe(false);
  });

  it("allows adult private invites only for mutual adult opt-in", () => {
    expect(
      canSendInvite({
        sender: { ...baseUser, userId: "sender", adultModeEnabled: true },
        recipient: { ...baseUser, userId: "recipient", adultModeEnabled: true },
        inviteType: "adult_private"
      })
    ).toBe(true);
  });
});

describe("blocking", () => {
  const blocks = [{ blocker_id: "a", blocked_id: "b" }];

  it("treats blocks as bidirectional for visibility", () => {
    expect(isBlockedBetween("a", "b", blocks)).toBe(true);
    expect(isBlockedBetween("b", "a", blocks)).toBe(true);
    expect(canSeeUser("a", "b", blocks)).toBe(false);
  });

  it("prevents invites between blocked users", () => {
    expect(
      canSendInvite({
        sender: { ...baseUser, userId: "a" },
        recipient: { ...baseUser, userId: "b" },
        inviteType: "chat",
        blocks
      })
    ).toBe(false);
  });
});

describe("chat access", () => {
  const acceptedInvite: Pick<Invite, "sender_id" | "recipient_id" | "status" | "expires_at"> = {
    sender_id: "sender",
    recipient_id: "recipient",
    status: "accepted",
    expires_at: new Date(Date.now() + 60_000).toISOString()
  };

  it("opens chat only for accepted invite participants", () => {
    expect(canOpenChat({ currentUserId: "sender", invite: acceptedInvite })).toBe(true);
    expect(canOpenChat({ currentUserId: "other", invite: acceptedInvite })).toBe(false);
  });

  it("does not open chat for pending invites", () => {
    expect(
      canOpenChat({
        currentUserId: "sender",
        invite: { ...acceptedInvite, status: "pending" }
      })
    ).toBe(false);
  });

  it("marks pending invites expired by time", () => {
    expect(
      isInviteExpired(
        { status: "pending", expires_at: "2026-07-02T00:00:00.000Z" },
        new Date("2026-07-02T00:10:01.000Z")
      )
    ).toBe(true);
  });
});
