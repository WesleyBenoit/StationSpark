import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { inviteLabels } from "@/constants/options";
import type { Invite } from "@/types/domain";

interface InviteCardProps {
  invite: Invite;
  direction: "sent" | "received";
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onOpenChat?: () => void;
}

export function InviteCard({ invite, direction, onAccept, onDecline, onCancel, onOpenChat }: InviteCardProps) {
  const expiresAt = new Date(invite.expires_at);

  return (
    <Card className="gap-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-base font-bold text-white">{inviteLabels[invite.invite_type]}</Text>
          <Text className="mt-1 text-sm text-charge-muted">
            {direction === "sent" ? "Sent invite" : "Received invite"}
          </Text>
        </View>
        <Badge label={invite.status} tone={invite.status === "accepted" ? "success" : "default"} />
      </View>
      {invite.message ? <Text className="text-sm leading-5 text-zinc-200">{invite.message}</Text> : null}
      {invite.status === "pending" ? (
        <Text className="text-xs text-charge-muted">
          Expires at {expiresAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </Text>
      ) : null}
      {invite.status === "pending" && direction === "received" ? (
        <View className="flex-row gap-3">
          <Button title="Accept" onPress={onAccept} className="flex-1" />
          <Button title="Decline" onPress={onDecline} variant="secondary" className="flex-1" />
        </View>
      ) : null}
      {invite.status === "pending" && direction === "sent" && onCancel ? (
        <Button title="Cancel invite" onPress={onCancel} variant="secondary" />
      ) : null}
      {invite.status === "accepted" && onOpenChat ? <Button title="Open chat" onPress={onOpenChat} /> : null}
    </Card>
  );
}
