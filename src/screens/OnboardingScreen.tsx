import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";

import { AdultModeGate } from "@/components/AdultModeGate";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Header } from "@/components/Header";
import { SafetyNotice } from "@/components/SafetyNotice";
import { ToggleChip } from "@/components/ToggleChip";
import { adultPresenceStatus, interestOptions, presenceStatuses, statusLabels, visibilityModes } from "@/constants/options";
import { onboardingSchema, type OnboardingInput } from "@/lib/validation";
import { useAuthStore } from "@/stores/authStore";

export function OnboardingScreen() {
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const { control, handleSubmit, setValue, watch, formState } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      display_name: "",
      bio: "",
      profile_photo_url: "",
      vehicle_make: "Tesla",
      vehicle_model: "",
      vehicle_color: "",
      interests: ["EVs", "Casual conversation"],
      adult_mode_enabled: false,
      adult_mode_consent: false,
      visibility_mode: "standard",
      default_status: "open_to_chat"
    }
  });

  const interests = watch("interests");
  const adultModeEnabled = watch("adult_mode_enabled");
  const adultConsent = watch("adult_mode_consent");
  const profilePhoto = watch("profile_photo_url");
  const visibilityMode = watch("visibility_mode");
  const defaultStatus = watch("default_status");

  const toggleInterest = (interest: (typeof interestOptions)[number]) => {
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
    } catch (error) {
      Alert.alert("Onboarding failed", error instanceof Error ? error.message : "Please review your profile.");
    }
  });

  return (
    <AppShell>
      <Header title="Set up StationSpark" subtitle={`Signed in as ${user?.email ?? "driver"}`} />
      <SafetyNotice body="Your public presence is station-level only. StationSpark does not show exact GPS coordinates, parking spots, or plates." />

      <Card className="mt-5 gap-4">
        <View className="items-center gap-3">
          <View className="h-24 w-24 overflow-hidden rounded-3xl bg-zinc-800">
            {profilePhoto ? <Image source={{ uri: profilePhoto }} className="h-full w-full" /> : null}
          </View>
          <Button title="Choose profile photo" variant="secondary" onPress={pickPhoto} />
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
        <Controller
          control={control}
          name="vehicle_model"
          render={({ field, fieldState }) => (
            <FormField label="Vehicle model" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
          )}
        />
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
        {formState.errors.interests?.message ? (
          <Text className="text-xs text-charge-danger">{formState.errors.interests.message}</Text>
        ) : null}
      </Card>

      <View className="mt-5">
        <AdultModeGate
          enabled={adultModeEnabled}
          consentAccepted={adultConsent}
          onToggle={toggleAdultMode}
          onConsentToggle={(enabled) => setValue("adult_mode_consent", enabled, { shouldValidate: true })}
        />
        {formState.errors.adult_mode_consent?.message ? (
          <Text className="mt-2 text-xs text-charge-danger">{formState.errors.adult_mode_consent.message}</Text>
        ) : null}
      </View>

      <Card className="mt-5 gap-4">
        <Text className="text-lg font-bold text-white">Conversation default</Text>
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

      <Button title="Finish setup" loading={loading || formState.isSubmitting} onPress={onSubmit} className="mt-6" />
    </AppShell>
  );
}
