import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Alert, Switch, Text, TextInput, View } from "react-native";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { SafetyNotice } from "@/components/SafetyNotice";
import { ToggleChip } from "@/components/ToggleChip";
import { adultInviteType, inviteLabels, inviteTypes } from "@/constants/options";
import type { InviteType } from "@/types/domain";
import type { RootStackParamList } from "@/navigation/types";
import { useAuthStore } from "@/stores/authStore";
import { useInviteStore } from "@/stores/inviteStore";
import { useStationStore } from "@/stores/stationStore";

type Props = NativeStackScreenProps<RootStackParamList, "InviteComposer">;

export function InviteComposerScreen({ navigation, route }: Props) {
  const { stationId, recipientId } = route.params;
  const profile = useAuthStore((state) => state.profile);
  const presence = useStationStore((state) => state.presenceByStation[stationId] ?? []);
  const loadStationPresence = useStationStore((state) => state.loadStationPresence);
  const sendInvite = useInviteStore((state) => state.sendInvite);
  const loading = useInviteStore((state) => state.loading);
  const [inviteType, setInviteType] = useState<InviteType>("chat");
  const [message, setMessage] = useState("");
  const [adultConsent, setAdultConsent] = useState(false);

  useEffect(() => {
    void loadStationPresence(stationId);
  }, [loadStationPresence, stationId]);

  const recipient = presence.find((item) => item.user_id === recipientId);

  const availableInviteTypes = useMemo(() => {
    const baseTypes: InviteType[] = [...inviteTypes];
    if (recipient?.can_send_adult_invite && profile?.adult_mode_enabled) {
      baseTypes.push(adultInviteType);
    }
    return baseTypes;
  }, [profile?.adult_mode_enabled, recipient?.can_send_adult_invite]);

  const isAdultInvite = inviteType === adultInviteType;

  const submit = async () => {
    if (isAdultInvite && !adultConsent) {
      Alert.alert("Consent required", "Confirm Private Intent consent before sending.");
      return;
    }

    if (isAdultInvite && message.trim().length < 12) {
      Alert.alert("Message required", "Add a short message so the recipient knows what you want before accepting.");
      return;
    }

    try {
      await sendInvite({
        recipient_id: recipientId,
        station_id: stationId,
        invite_type: inviteType,
        message: message.trim() || undefined
      });
      Alert.alert("Invite sent", "Chat opens only if the recipient accepts within 10 minutes.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Invite failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <AppShell>
      <Header
        title="Send invite"
        subtitle={recipient ? `Invite ${recipient.display_name}` : "Station invite"}
        onBackPress={() => navigation.goBack()}
      />
      <SafetyNotice body="Invites expire after 10 minutes. You cannot message a driver until they accept." />

      <Card className="mt-5 gap-4">
        <Text className="text-lg font-bold text-white">Invite type</Text>
        <View className="flex-row flex-wrap gap-2">
          {availableInviteTypes.map((type) => (
            <ToggleChip key={type} label={inviteLabels[type]} selected={inviteType === type} onPress={() => setInviteType(type)} />
          ))}
        </View>

        {!availableInviteTypes.includes(adultInviteType) ? (
          <Text className="text-sm leading-5 text-charge-muted">
            Private Intent invites appear only when both drivers enabled Private Intent (18+).
          </Text>
        ) : null}

        {isAdultInvite ? (
          <View className="gap-3">
            <SafetyNotice
              title="Private Intent invite"
              tone="warning"
              body="This invite is private, opt-in, and consent-based. No paid services, coercion, minors, explicit images, trafficking, or unsafe requests."
            />
            <View className="flex-row items-center justify-between rounded-2xl bg-zinc-900 p-4">
              <Text className="mr-4 flex-1 text-sm leading-5 text-white">
                I understand this is private, age-gated, and requires mutual consent.
              </Text>
              <Switch
                value={adultConsent}
                onValueChange={setAdultConsent}
                thumbColor={adultConsent ? "#FFFFFF" : "#A1A1AA"}
                trackColor={{ false: "#3F3F46", true: "#30D158" }}
              />
            </View>
          </View>
        ) : null}

        <View className="gap-2">
          <Text className="text-sm font-semibold text-white">{isAdultInvite ? "Short intent message" : "Optional note"}</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={180}
            placeholder={isAdultInvite ? "I am interested in a private adult connection if the chemistry is mutual. Chat first?" : "Coffee nearby? Talking Model Y mods?"}
            placeholderTextColor="#71717A"
            className="min-h-24 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base text-white"
          />
          <Text className="text-xs text-charge-muted">{message.length}/180</Text>
        </View>
      </Card>

      <Button title="Send invite" loading={loading} onPress={submit} className="mt-6" />
    </AppShell>
  );
}
