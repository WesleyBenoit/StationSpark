import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";

import { AdultModeGate } from "@/components/AdultModeGate";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Header } from "@/components/Header";
import { ToggleChip } from "@/components/ToggleChip";
import { adultPresenceStatus, interestOptions, presenceStatuses, statusLabels, visibilityModes } from "@/constants/options";
import { onboardingSchema, type OnboardingInput } from "@/lib/validation";
import type { RootStackParamList } from "@/navigation/types";
import { useAuthStore } from "@/stores/authStore";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const loading = useAuthStore((state) => state.loading);

  const { control, handleSubmit, setValue, watch, formState } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    values: {
      display_name: profile?.display_name ?? "",
      bio: profile?.bio ?? "",
      profile_photo_url: profile?.profile_photo_url ?? "",
      vehicle_make: profile?.vehicle_make ?? "Tesla",
      vehicle_model: profile?.vehicle_model ?? "",
      vehicle_color: profile?.vehicle_color ?? "",
      interests: (profile?.interests?.length ? profile.interests : ["EVs"]) as OnboardingInput["interests"],
      adult_mode_enabled: Boolean(profile?.adult_mode_enabled),
      adult_mode_consent: Boolean(profile?.adult_mode_enabled),
      visibility_mode: profile?.visibility_mode ?? "standard",
      default_status: profile?.default_status ?? "open_to_chat"
    }
  });

  const interests = watch("interests");
  const adultModeEnabled = watch("adult_mode_enabled");
  const adultConsent = watch("adult_mode_consent");
  const profilePhoto = watch("profile_photo_url");
  const defaultStatus = watch("default_status");
  const visibilityMode = watch("visibility_mode");

  const toggleInterest = (interest: string) => {
    if (interest === "Adult connections" && !adultModeEnabled) return;
    const next = interests.includes(interest)
      ? interests.filter((item) => item !== interest)
      : [...interests, interest];
    setValue("interests", next as OnboardingInput["interests"], { shouldValidate: true });
  };

  const toggleAdultMode = (enabled: boolean) => {
    setValue("adult_mode_enabled", enabled, { shouldValidate: true });
    if (!enabled) {
      setValue("adult_mode_consent", false, { shouldValidate: true });
      setValue(
        "interests",
        interests.filter((interest) => interest !== "Adult connections") as OnboardingInput["interests"],
        { shouldValidate: true }
      );
      if (defaultStatus === adultPresenceStatus) {
        setValue("default_status", "open_to_chat", { shouldValidate: true });
      }
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1]
    });

    if (!result.canceled) {
      setValue("profile_photo_url", result.assets[0]?.uri ?? "", { shouldValidate: true });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await completeOnboarding(values);
      Alert.alert("Profile saved", "Your public StationSpark profile was updated.");
    } catch (error) {
      Alert.alert("Could not save profile", error instanceof Error ? error.message : "Please try again.");
    }
  });

  return (
    <AppShell>
      <Header title="Profile" subtitle="Public driver and vehicle details" rightLabel="Settings" onRightPress={() => navigation.navigate("Settings")} />

      <Card className="gap-4">
        <View className="items-center gap-3">
          <View className="h-24 w-24 overflow-hidden rounded-3xl bg-zinc-800">
            {profilePhoto ? <Image source={{ uri: profilePhoto }} className="h-full w-full" /> : null}
          </View>
          <Button title="Update photo" variant="secondary" onPress={pickPhoto} />
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Badge label={user?.identity_verified ? "Identity verified" : "Identity pending"} tone={user?.identity_verified ? "success" : "default"} />
          <Badge label={user?.phone_verified ? "Phone verified" : "Phone pending"} tone={user?.phone_verified ? "success" : "default"} />
          <Badge label="Premium placeholder" tone="accent" />
        </View>

        <Controller
          control={control}
          name="display_name"
          render={({ field, fieldState }) => (
            <FormField label="Name" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
          )}
        />
        <Controller
          control={control}
          name="bio"
          render={({ field, fieldState }) => (
            <FormField
              label="Bio"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              className="min-h-24 py-3"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="vehicle_model"
          render={({ field, fieldState }) => (
            <FormField label="Vehicle model" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
          )}
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Controller
              control={control}
              name="vehicle_make"
              render={({ field, fieldState }) => (
                <FormField label="Make" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
              )}
            />
          </View>
          <View className="flex-1">
            <Controller
              control={control}
              name="vehicle_color"
              render={({ field, fieldState }) => (
                <FormField label="Color" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
              )}
            />
          </View>
        </View>
      </Card>

      <Card className="mt-5 gap-4">
        <Text className="text-lg font-bold text-white">Interests</Text>
        <View className="flex-row flex-wrap gap-2">
          {interestOptions.map((interest) => (
            <ToggleChip
              key={interest}
              label={interest}
              selected={interests.includes(interest)}
              disabled={interest === "Adult connections" && !adultModeEnabled}
              onPress={() => toggleInterest(interest)}
            />
          ))}
        </View>
      </Card>

      <View className="mt-5">
        <AdultModeGate
          enabled={adultModeEnabled}
          consentAccepted={adultConsent}
          onToggle={toggleAdultMode}
          onConsentToggle={(enabled) => setValue("adult_mode_consent", enabled, { shouldValidate: true })}
        />
      </View>

      <Card className="mt-5 gap-4">
        <Text className="text-lg font-bold text-white">Status preferences</Text>
        <View className="flex-row flex-wrap gap-2">
          {[...presenceStatuses, ...(adultModeEnabled && adultConsent ? [adultPresenceStatus] : [])].map((status) => (
            <ToggleChip
              key={status}
              label={statusLabels[status]}
              selected={defaultStatus === status}
              onPress={() => setValue("default_status", status, { shouldValidate: true })}
            />
          ))}
        </View>
        <Text className="text-lg font-bold text-white">Visibility</Text>
        <View className="flex-row flex-wrap gap-2">
          {visibilityModes.map((mode) => (
            <ToggleChip
              key={mode}
              label={mode.replace("_", " ")}
              selected={visibilityMode === mode}
              onPress={() => setValue("visibility_mode", mode, { shouldValidate: true })}
            />
          ))}
        </View>
      </Card>

      {formState.errors.adult_mode_consent?.message ? (
        <Text className="mt-2 text-xs text-charge-danger">{formState.errors.adult_mode_consent.message}</Text>
      ) : null}
      <Button title="Save profile" loading={loading || formState.isSubmitting} onPress={onSubmit} className="mt-6" />
    </AppShell>
  );
}
