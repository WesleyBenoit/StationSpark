import { ReactNode } from "react";
import { Switch, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { SafetyNotice } from "@/components/SafetyNotice";

interface AdultModeGateProps {
  enabled: boolean;
  consentAccepted?: boolean;
  onToggle?: (enabled: boolean) => void;
  onConsentToggle?: (enabled: boolean) => void;
  children?: ReactNode;
}

export function AdultModeGate({
  enabled,
  consentAccepted = false,
  onToggle,
  onConsentToggle,
  children
}: AdultModeGateProps) {
  return (
    <Card className="gap-4">
      <View className="flex-row items-center justify-between">
        <View className="mr-4 flex-1">
          <Text className="text-lg font-bold text-white">Private Intent (18+)</Text>
          <Text className="mt-1 text-sm leading-5 text-charge-muted">
            Private opt-in adult connection preferences for verified adults.
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          thumbColor={enabled ? "#FFFFFF" : "#A1A1AA"}
          trackColor={{ false: "#3F3F46", true: "#2F80FF" }}
        />
      </View>

      {enabled ? (
        <>
          <SafetyNotice
            title="Consent required"
            body="Private intent stays hidden by default, appears only when both people enable it, and can be disabled anytime."
            tone="warning"
          />
          <View className="flex-row items-center justify-between rounded-2xl bg-zinc-900 p-4">
            <Text className="mr-4 flex-1 text-sm leading-5 text-white">
              I confirm I am 18+ and consent to private intent visibility.
            </Text>
            <Switch
              value={consentAccepted}
              onValueChange={onConsentToggle}
              thumbColor={consentAccepted ? "#FFFFFF" : "#A1A1AA"}
              trackColor={{ false: "#3F3F46", true: "#30D158" }}
            />
          </View>
          {consentAccepted ? children : null}
        </>
      ) : null}
    </Card>
  );
}
