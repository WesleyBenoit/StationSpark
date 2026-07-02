import { View, type ViewProps } from "react-native";

export function Card({ className = "", ...props }: ViewProps & { className?: string }) {
  return <View className={`rounded-2xl border border-zinc-800 bg-charge-card p-4 ${className}`} {...props} />;
}
