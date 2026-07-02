import { Text, View } from "react-native";

interface BadgeProps {
  label: string;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
}

const toneClasses = {
  default: { container: "bg-zinc-800", text: "text-zinc-200" },
  accent: { container: "bg-blue-500/20", text: "text-blue-200" },
  success: { container: "bg-green-500/20", text: "text-green-200" },
  warning: { container: "bg-yellow-500/20", text: "text-yellow-100" },
  danger: { container: "bg-red-500/20", text: "text-red-100" }
};

export function Badge({ label, tone = "default" }: BadgeProps) {
  const classes = toneClasses[tone];

  return (
    <View className={`rounded-full px-3 py-1 ${classes.container}`}>
      <Text className={`text-xs font-semibold ${classes.text}`}>{label}</Text>
    </View>
  );
}
