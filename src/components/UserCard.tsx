import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { StatusPill } from "@/components/StatusPill";
import type { StationPresence } from "@/types/domain";

interface UserCardProps {
  presence: StationPresence;
  onInvite?: () => void;
  onReport?: () => void;
  inviteDisabled?: boolean;
}

export function UserCard({ presence, onInvite, onReport, inviteDisabled }: UserCardProps) {
  const vehicle = [presence.vehicle_color, presence.vehicle_make, presence.vehicle_model].filter(Boolean).join(" ");

  return (
    <Card className="gap-4">
      <View className="flex-row">
        <View className="h-14 w-14 overflow-hidden rounded-2xl bg-zinc-800">
          {presence.profile_photo_url ? (
            <Image source={{ uri: presence.profile_photo_url }} className="h-full w-full" />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <MaterialCommunityIcons name="account" size={28} color="#A1A1AA" />
            </View>
          )}
        </View>
        <View className="ml-4 flex-1">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-lg font-bold text-white">{presence.display_name}</Text>
              <Text className="mt-1 text-sm text-charge-muted">{vehicle || "EV driver"}</Text>
            </View>
            {onReport ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Report user" onPress={onReport} className="p-2">
                <MaterialCommunityIcons name="flag-outline" size={20} color="#A1A1AA" />
              </Pressable>
            ) : null}
          </View>
          <View className="mt-3">
            <StatusPill status={presence.status} />
          </View>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {presence.interests.slice(0, 4).map((interest) => (
          <Badge key={interest} label={interest} tone={interest === "Adult connection" ? "warning" : "default"} />
        ))}
      </View>

      <View className="flex-row items-center justify-between rounded-2xl bg-zinc-900 px-4 py-3">
        <Text className="text-sm text-charge-muted">Remaining charge time</Text>
        <Text className="text-sm font-semibold text-white">
          {presence.estimated_departure_at
            ? `Until ${new Date(presence.estimated_departure_at).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
              })}`
            : "Not shared"}
        </Text>
      </View>

      {onInvite ? <Button title="Send invite" onPress={onInvite} disabled={inviteDisabled} /> : null}
    </Card>
  );
}
