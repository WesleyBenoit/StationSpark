import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormField } from "@/components/FormField";
import { Header } from "@/components/Header";
import { ToggleChip } from "@/components/ToggleChip";
import { reportSchema, type ReportInput } from "@/lib/validation";
import type { RootStackParamList } from "@/navigation/types";
import { useSafetyStore } from "@/stores/safetyStore";

type Props = NativeStackScreenProps<RootStackParamList, "Report">;

const categories: ReportInput["category"][] = [
  "harassment",
  "safety",
  "spam",
  "explicit_public_content",
  "impersonation",
  "other"
];

export function ReportScreen({ navigation, route }: Props) {
  const reportUser = useSafetyStore((state) => state.reportUser);
  const loading = useSafetyStore((state) => state.loading);
  const { reportedUserId, stationId } = route.params;
  const { control, handleSubmit, setValue, watch, formState } = useForm<ReportInput>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reported_user_id: reportedUserId,
      station_id: stationId,
      category: "safety",
      description: ""
    }
  });

  const category = watch("category");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await reportUser(values);
      Alert.alert("Report submitted", "Reports are saved for moderation review. The user remains usable unless banned.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Report failed", error instanceof Error ? error.message : "Please try again.");
    }
  });

  return (
    <AppShell>
      <Header title="Report user" subtitle="Describe the safety concern." onBackPress={() => navigation.goBack()} />
      <Card className="gap-4">
        <Text className="text-lg font-bold text-white">Category</Text>
        <View className="flex-row flex-wrap gap-2">
          {categories.map((item) => (
            <ToggleChip
              key={item}
              label={item.replace(/_/g, " ")}
              selected={category === item}
              onPress={() => setValue("category", item, { shouldValidate: true })}
            />
          ))}
        </View>
        <Controller
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <FormField
              label="Description"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              className="min-h-32 py-3"
              error={fieldState.error?.message}
            />
          )}
        />
        {formState.errors.reported_user_id?.message ? (
          <Text className="text-xs text-charge-danger">{formState.errors.reported_user_id.message}</Text>
        ) : null}
        <Button title="Submit report" variant="danger" loading={loading || formState.isSubmitting} onPress={onSubmit} />
      </Card>
    </AppShell>
  );
}
