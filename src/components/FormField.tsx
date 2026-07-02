import { Text, TextInput, type TextInputProps, View } from "react-native";

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function FormField({ label, error, className = "", ...props }: FormFieldProps & { className?: string }) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-white">{label}</Text>
      <TextInput
        placeholderTextColor="#71717A"
        className={`min-h-12 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-base text-white ${className}`}
        {...props}
      />
      {error ? <Text className="text-xs text-charge-danger">{error}</Text> : null}
    </View>
  );
}
