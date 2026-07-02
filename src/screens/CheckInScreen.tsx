import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Alert, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Header } from "@/components/Header";
import { SafetyNotice } from "@/components/SafetyNotice";
import { ToggleChip } from "@/components/ToggleChip";
import { adultPresenceStatus, presenceStatuses, statusLabels, visibilityModes } from "@/constants/options";
import { checkInSchema, type CheckInInput } from "@/lib/validation";
import { useAuthStore } from "@/stores/authStore";
import { useStationStore } from "@/stores/stationStore";

export function CheckInScreen() {
  const profile = useAuthStore((state) => state.profile);
  const stations = useStationStore((state) => state.stations);
  const loading = useStationStore((state) => state.loading);
  const loadStations = useStationStore((state) => state.loadStations);
  const submitCheckIn = useStationStore((state) => state.submitCheckIn);
  const checkOut = useStationStore((state) => state.checkOut);

  const { control, handleSubmit, setValue, watch, formState } = useForm<CheckInInput>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      station_id: "",
      status: profile?.default_status ?? "open_to_chat",
      visibility: profile?.visibility_mode ?? "standard",
      estimated_minutes_remaining: 30
    }
  });

  const selectedStationId = watch("station_id");
  const selectedStatus = watch("status");
  const visibility = watch("visibility");

  useEffect(() => {
    void loadStations();
  }, [loadStations]);

  useEffect(() => {
    if (!selectedStationId && stations[0]) {
      setValue("station_id", stations[0].id, { shouldValidate: true });
    }
  }, [selectedStationId, setValue, stations]);

  const statuses = profile?.adult_mode_enabled ? [...presenceStatuses, adultPresenceStatus] : presenceStatuses;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await submitCheckIn(values);
      Alert.alert("Checked in", "Your station-level presence is now visible based on your privacy settings.");
    } catch (error) {
      Alert.alert("Check-in failed", error instanceof Error ? error.message : "Please try again.");
    }
  });

  const onCheckOut = async () => {
    try {
      await checkOut();
      Alert.alert("Checked out", "Your active charging presence has been hidden.");
    } catch (error) {
      Alert.alert("Checkout failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <AppShell>
      <Header title="Check in" subtitle="Share station-level presence while charging." />
      <SafetyNotice body="StationSpark shows your station, status, and estimated departure only. It never exposes your exact GPS position." />

      <Card className="mt-5 gap-4">
        <Text className="text-lg font-bold text-white">Charging station</Text>
        <View className="gap-3">
          {stations.map((station) => (
            <ToggleChip
              key={station.id}
              label={`${station.name} - ${station.city}`}
              selected={selectedStationId === station.id}
              onPress={() => setValue("station_id", station.id, { shouldValidate: true })}
            />
          ))}
        </View>
        {formState.errors.station_id?.message ? <Text className="text-xs text-charge-danger">Choose a station.</Text> : null}
      </Card>

      <Card className="mt-5 gap-4">
        <Text className="text-lg font-bold text-white">Status</Text>
        <View className="flex-row flex-wrap gap-2">
          {statuses.map((status) => (
            <ToggleChip
              key={status}
              label={statusLabels[status]}
              selected={selectedStatus === status}
              onPress={() => setValue("status", status, { shouldValidate: true })}
            />
          ))}
        </View>
        {selectedStatus === adultPresenceStatus ? (
          <SafetyNotice
            tone="warning"
            title="Private adult status"
            body="This will only be visible as an adult invite option to people who also enabled Adult Mode."
          />
        ) : null}

        <Controller
          control={control}
          name="estimated_minutes_remaining"
          render={({ field, fieldState }) => (
            <FormField
              label="Estimated minutes remaining"
              keyboardType="number-pad"
              value={String(field.value)}
              onChangeText={(text) => field.onChange(Number(text.replace(/[^0-9]/g, "")) || 0)}
              error={fieldState.error?.message}
            />
          )}
        />
      </Card>

      <Card className="mt-5 gap-4">
        <Text className="text-lg font-bold text-white">Visibility</Text>
        <View className="flex-row flex-wrap gap-2">
          {visibilityModes.map((mode) => (
            <ToggleChip
              key={mode}
              label={mode.replace("_", " ")}
              selected={visibility === mode}
              onPress={() => setValue("visibility", mode, { shouldValidate: true })}
            />
          ))}
        </View>
      </Card>

      <View className="mt-6 gap-3">
        <Button title="Check in now" loading={loading} onPress={onSubmit} />
        <Button title="Check out / hide me" variant="secondary" onPress={onCheckOut} />
      </View>
    </AppShell>
  );
}
