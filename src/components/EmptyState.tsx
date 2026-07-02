import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = "ev-station", title, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-6">
      <MaterialCommunityIcons name={icon} size={34} color="#2F80FF" />
      <Text className="mt-4 text-center text-lg font-bold text-white">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-charge-muted">{body}</Text>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} className="mt-5 w-full" /> : null}
    </View>
  );
}
