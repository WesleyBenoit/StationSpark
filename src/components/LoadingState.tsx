import { ActivityIndicator, Text, View } from "react-native";

export function LoadingState({ label = "Loading StationSpark" }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-charge-bg p-6">
      <ActivityIndicator color="#2F80FF" size="large" />
      <Text className="mt-4 text-sm text-charge-muted">{label}</Text>
    </View>
  );
}
