import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Header } from "@/components/Header";
import { signInSchema, type SignInInput } from "@/lib/validation";
import type { AuthStackParamList } from "@/navigation/types";
import { requestOAuthPlaceholder, requestPhoneVerificationPlaceholder } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

export function SignInScreen({ navigation }: Props) {
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const { control, handleSubmit, formState } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = handleSubmit(async (values) => {
    await login(values);
  });

  const showPlaceholder = async (kind: "google" | "apple" | "phone") => {
    try {
      if (kind === "phone") await requestPhoneVerificationPlaceholder();
      else await requestOAuthPlaceholder(kind);
    } catch (placeholderError) {
      Alert.alert("MVP placeholder", placeholderError instanceof Error ? placeholderError.message : "Not configured yet.");
    }
  };

  return (
    <AppShell>
      <Header title="Log in" subtitle="Return to your station network." onBackPress={() => navigation.goBack()} />
      <Card className="gap-4">
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <FormField
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <FormField
              label="Password"
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        {error ? <Text className="text-sm text-charge-danger">{error}</Text> : null}
        <Button title="Log In" loading={loading || formState.isSubmitting} onPress={onSubmit} />
      </Card>

      <View className="mt-5 gap-3">
        <Button title="Continue with Google" variant="secondary" onPress={() => showPlaceholder("google")} />
        <Button title="Continue with Apple" variant="secondary" onPress={() => showPlaceholder("apple")} />
        <Button title="Phone verification" variant="ghost" onPress={() => showPlaceholder("phone")} />
      </View>
    </AppShell>
  );
}
