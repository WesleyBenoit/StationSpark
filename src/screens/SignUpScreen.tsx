import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Switch, Text, View } from "react-native";
import { Controller, useForm, type Control } from "react-hook-form";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Header } from "@/components/Header";
import { SafetyNotice } from "@/components/SafetyNotice";
import { signUpSchema, type SignUpInput } from "@/lib/validation";
import type { AuthStackParamList } from "@/navigation/types";
import { useAuthStore } from "@/stores/authStore";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

export function SignUpScreen({ navigation }: Props) {
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const { control, handleSubmit, formState } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      is18Plus: false as true,
      termsAccepted: false as true
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await register(values);
    } catch (submitError) {
      Alert.alert("Sign up failed", submitError instanceof Error ? submitError.message : "Please try again.");
    }
  });

  return (
    <AppShell>
      <Header title="Create account" subtitle="Adults only, safety-first by design." onBackPress={() => navigation.goBack()} />
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
        <ConsentSwitch
          control={control}
          name="is18Plus"
          label="I confirm I am 18 or older."
          error={formState.errors.is18Plus?.message}
        />
        <ConsentSwitch
          control={control}
          name="termsAccepted"
          label="I accept the terms, safety policy, and privacy rules."
          error={formState.errors.termsAccepted?.message}
        />
        <SafetyNotice body="StationSpark never shows exact GPS coordinates, license plates, or adult preferences in public station presence." />
        {error ? <Text className="text-sm text-charge-danger">{error}</Text> : null}
        <Button title="Sign Up" loading={loading || formState.isSubmitting} onPress={onSubmit} />
      </Card>
    </AppShell>
  );
}

function ConsentSwitch({
  control,
  name,
  label,
  error
}: {
  control: Control<SignUpInput>;
  name: "is18Plus" | "termsAccepted";
  label: string;
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <View>
          <View className="flex-row items-center justify-between rounded-2xl bg-zinc-900 p-4">
            <Text className="mr-4 flex-1 text-sm leading-5 text-white">{label}</Text>
            <Switch
              value={Boolean(field.value)}
              onValueChange={field.onChange}
              thumbColor={field.value ? "#FFFFFF" : "#A1A1AA"}
              trackColor={{ false: "#3F3F46", true: "#2F80FF" }}
            />
          </View>
          {error ? <Text className="mt-2 text-xs text-charge-danger">{error}</Text> : null}
        </View>
      )}
    />
  );
}
