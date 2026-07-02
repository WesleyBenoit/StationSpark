import { Text, View } from "react-native";

import { statusLabels } from "@/constants/options";
import type { PresenceStatus } from "@/types/domain";

const toneByStatus: Record<PresenceStatus, string> = {
  open_to_chat: "border-charge-success bg-green-500/10",
  watching_movie: "border-charge-accent bg-blue-500/10",
  working: "border-zinc-600 bg-zinc-800",
  road_tripping: "border-charge-warning bg-yellow-500/10",
  networking: "border-charge-accent bg-blue-500/10",
  talking_tesla: "border-charge-accent bg-blue-500/10",
  do_not_disturb: "border-charge-danger bg-red-500/10",
  adult_mode_available: "border-zinc-500 bg-zinc-800"
};

export function StatusPill({ status }: { status: PresenceStatus }) {
  return (
    <View className={`self-start rounded-full border px-3 py-1 ${toneByStatus[status]}`}>
      <Text className="text-xs font-semibold text-white">{statusLabels[status]}</Text>
    </View>
  );
}
