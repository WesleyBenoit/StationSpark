import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
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
import { visibilityModes } from "@/constants/options";
import { arrivalIntentSchema, type ArrivalIntentInput } from "@/lib/validation";
import type { RootStackParamList } from "@/navigation/types";
import { useStationStore } from "@/stores/stationStore";

type Props = NativeStackScreenProps<RootStackParamList, "OnTheWay">;

export function OnTheWayScreen({ navigation }: Props) {
  const stations = useStationStore((state) => state.stations);
  const loading = useStationStore((state) => state.loading);
  const loadStations = useStationStore((state) => state.loadStations);
  const submitArrivalIntent = useStationStore((state) => state.submitArrivalIntent);
  const { control, handleSubmit, setValue, watch, formState } = useForm<ArrivalIntentInput>({
    resolver: zodResolver(arrivalIntentSchema),
    defaultValues: { station_id: "", eta_minutes: 15, visibility: "standard" }
  });
  const selectedStationId = watch("station_id");
  const visibility = watch("visibility");

  useEffect(() => {
    void loadStations();
  }, [loadStations]);

  useEffect(() => {
    if (!selectedStationId && stations[0]) {
      setValue("station_id", stations[0].id, { shouldValidate: true });
    }
  }, [selectedStationId, setValue, stations]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await submitArrivalIntent(values);
      Alert.alert("On the way", "Your ETA is visible at the destination station based on your privacy settings.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Could not mark on the way", error instanceof Error ? error.message : "Please try again.");
    }
  });

  return (
    <AppShell>
      <Header title="On my way" subtitle="Let a station know you are arriving." onBackPress={() => navigation.goBack()} />
      <SafetyNotice body="Arrival intent shows destination station and ETA only. It does not expose your live route." />

      <Card className="mt-5 gap-4">
        <Text className="text-lg font-bold text-white">Destination station</Text>
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

        <Controller
          control={control}
          name="eta_minutes"
          render={({ field, fieldState }) => (
            <FormField
              label="ETA in minutes"
              keyboardType="number-pad"
              value={String(field.value)}
              onChangeText={(text) => field.onChange(Number(text.replace(/[^0-9]/g, "")) || 0)}
              error={fieldState.error?.message}
            />
          )}
        />

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

      <Button title="Mark on my way" loading={loading} onPress={onSubmit} className="mt-6" />
    </AppShell>
  );
}
