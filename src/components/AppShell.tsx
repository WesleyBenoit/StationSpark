import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AppShellProps extends ViewProps {
  scroll?: boolean;
}

export function AppShell({ children, scroll = true, className = "", ...props }: AppShellProps & { className?: string }) {
  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
      className="flex-1"
    >
      <View className={`px-5 pt-4 ${className}`} {...props}>
        {children}
      </View>
    </ScrollView>
  ) : (
    <View className={`flex-1 px-5 pt-4 ${className}`} {...props}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-charge-bg">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
