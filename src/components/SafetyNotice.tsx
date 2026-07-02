import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

interface SafetyNoticeProps {
  title?: string;
  body: string;
  tone?: "info" | "warning" | "danger";
}

const toneClass = {
  info: "border-blue-500/40 bg-blue-500/10",
  warning: "border-yellow-500/40 bg-yellow-500/10",
  danger: "border-red-500/40 bg-red-500/10"
};

const iconColor = {
  info: "#2F80FF",
  warning: "#FFD60A",
  danger: "#FF453A"
};

export function SafetyNotice({ title = "Safety first", body, tone = "info" }: SafetyNoticeProps) {
  return (
    <View className={`flex-row rounded-2xl border p-4 ${toneClass[tone]}`}>
      <MaterialCommunityIcons name="shield-check" size={22} color={iconColor[tone]} />
      <View className="ml-3 flex-1">
        <Text className="font-semibold text-white">{title}</Text>
        <Text className="mt-1 text-sm leading-5 text-zinc-300">{body}</Text>
      </View>
    </View>
  );
}
