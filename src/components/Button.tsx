import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-charge-accent",
  secondary: "bg-zinc-800 border border-zinc-700",
  danger: "bg-charge-danger",
  ghost: "bg-transparent border border-zinc-700"
};

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps & { className?: string }) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`min-h-12 flex-row items-center justify-center rounded-2xl px-5 ${variantClasses[variant]} ${
        isDisabled ? "opacity-50" : "opacity-100"
      } ${className}`}
      {...props}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-base font-semibold text-white">{title}</Text>}
    </Pressable>
  );
}
