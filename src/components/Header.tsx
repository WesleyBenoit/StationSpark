import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightLabel?: string;
  onRightPress?: () => void;
  onBackPress?: () => void;
}

export function Header({ title, subtitle, rightLabel, onRightPress, onBackPress }: HeaderProps) {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <View className="flex-1 flex-row items-center">
        {onBackPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBackPress}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-zinc-900"
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color="#FFFFFF" />
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text className="text-2xl font-bold text-white">{title}</Text>
          {subtitle ? <Text className="mt-1 text-sm text-charge-muted">{subtitle}</Text> : null}
        </View>
      </View>
      {rightLabel && onRightPress ? (
        <Pressable onPress={onRightPress} className="rounded-full border border-zinc-700 px-4 py-2">
          <Text className="text-sm font-semibold text-white">{rightLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
