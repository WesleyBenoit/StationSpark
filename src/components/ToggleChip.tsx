import { Pressable, Text } from "react-native";

interface ToggleChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function ToggleChip({ label, selected, onPress, disabled }: ToggleChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${
        selected ? "border-charge-accent bg-blue-500/20" : "border-zinc-700 bg-zinc-900"
      } ${disabled ? "opacity-40" : "opacity-100"}`}
    >
      <Text className={`text-sm font-semibold ${selected ? "text-white" : "text-charge-muted"}`}>{label}</Text>
    </Pressable>
  );
}
