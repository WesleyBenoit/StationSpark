import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Alert, Switch, Text, View } from "react-native";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { SafetyNotice } from "@/components/SafetyNotice";
import type { RootStackParamList } from "@/navigation/types";
import * as profileService from "@/services/profileService";
import { useAuthStore } from "@/stores/authStore";
import { useSafetyStore } from "@/stores/safetyStore";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function SafetyCenterScreen() {
  const navigation = useNavigation<Navigation>();
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const blocks = useSafetyStore((state) => state.blocks);
  const loadBlocks = useSafetyStore((state) => state.loadBlocks);
  const unblockUser = useSafetyStore((state) => state.unblockUser);
  const [adultConsent, setAdultConsent] = useState(false);

  useEffect(() => {
    void loadBlocks();
  }, [loadBlocks]);

  const toggleAdultMode = async (enabled: boolean) => {
    if (enabled && !adultConsent) {
      Alert.alert("Consent required", "Enable the consent switch before turning on Private Intent (18+).");
      return;
    }

    try {
      const nextProfile = await profileService.updateAdultMode(enabled, adultConsent);
      setProfile(nextProfile);
    } catch (error) {
      Alert.alert("Could not update Private Intent", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const toggleGhostMode = async (enabled: boolean) => {
    try {
      const nextProfile = await profileService.updateVisibility(enabled ? "ghost" : "standard");
      setProfile(nextProfile);
      await refreshProfile();
    } catch (error) {
      Alert.alert("Could not update visibility", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <AppShell>
      <Header title="Safety Center" subtitle="Privacy, consent, reporting, and emergency guidance" />

      <SafetyNotice
        tone="danger"
        title="Emergency guidance"
        body="If you feel unsafe, leave the area if possible and contact local emergency services. StationSpark reports are not emergency response."
      />

      <Card className="mt-5 gap-4">
        <Text className="text-lg font-bold text-white">Consent rules</Text>
        <Text className="text-sm leading-5 text-charge-muted">
          Chat requires accepted invites. Private Intent (18+) is off by default, private, and visible only when both drivers explicitly enable it.
        </Text>
        <Button title="Report a user" variant="secondary" onPress={() => Alert.alert("Report", "Open a driver card to report a specific user.")} />
      </Card>

      <Card className="mt-5 gap-4">
        <View className="flex-row items-center justify-between">
          <View className="mr-4 flex-1">
            <Text className="text-lg font-bold text-white">Private Intent (18+)</Text>
            <Text className="mt-1 text-sm leading-5 text-charge-muted">
              Private opt-in adult connection preferences for verified adults.
            </Text>
          </View>
          <Switch
            value={Boolean(profile?.adult_mode_enabled)}
            onValueChange={toggleAdultMode}
            thumbColor={profile?.adult_mode_enabled ? "#FFFFFF" : "#A1A1AA"}
            trackColor={{ false: "#3F3F46", true: "#2F80FF" }}
          />
        </View>
        <View className="flex-row items-center justify-between rounded-2xl bg-zinc-900 p-4">
          <Text className="mr-4 flex-1 text-sm leading-5 text-white">
            I confirm I am 18+ and consent to private intent visibility.
          </Text>
          <Switch
            value={adultConsent}
            onValueChange={setAdultConsent}
            thumbColor={adultConsent ? "#FFFFFF" : "#A1A1AA"}
            trackColor={{ false: "#3F3F46", true: "#30D158" }}
          />
        </View>
      </Card>

      <Card className="mt-5 gap-3">
        <Text className="text-lg font-bold text-white">Prohibited private use</Text>
        <Text className="text-sm leading-5 text-charge-muted">
          No paid services, coercion, minors, explicit public content, trafficking, harassment, or unsafe requests. Reported content is saved for moderation.
        </Text>
      </Card>

      <Card className="mt-5 gap-4">
        <View className="flex-row items-center justify-between">
          <View className="mr-4 flex-1">
            <Text className="text-lg font-bold text-white">Ghost Mode</Text>
            <Text className="mt-1 text-sm leading-5 text-charge-muted">
              Hide your profile and station presence. Premium gating is stubbed for MVP.
            </Text>
          </View>
          <Switch
            value={profile?.visibility_mode === "ghost"}
            onValueChange={toggleGhostMode}
            thumbColor={profile?.visibility_mode === "ghost" ? "#FFFFFF" : "#A1A1AA"}
            trackColor={{ false: "#3F3F46", true: "#2F80FF" }}
          />
        </View>
      </Card>

      <Card className="mt-5 gap-4">
        <Text className="text-lg font-bold text-white">Blocked users</Text>
        {blocks.length ? (
          blocks.map((block) => (
            <View key={block.id} className="flex-row items-center justify-between rounded-2xl bg-zinc-900 p-4">
              <Text className="mr-4 flex-1 text-sm text-white">{block.blocked_id}</Text>
              <Button title="Unblock" variant="ghost" onPress={() => unblockUser(block.blocked_id)} />
            </View>
          ))
        ) : (
          <Text className="text-sm text-charge-muted">No blocked users.</Text>
        )}
      </Card>

      <Card className="mt-5 gap-3">
        <Text className="text-lg font-bold text-white">Trusted contact</Text>
        <Text className="text-sm leading-5 text-charge-muted">
          Phase 2 placeholder for sharing a meetup or charging stop with someone you trust.
        </Text>
        <Button title="Configure later" variant="secondary" onPress={() => Alert.alert("Trusted contact", "Coming in Phase 2.")} />
      </Card>

      <Button title="Privacy settings" variant="secondary" onPress={() => navigation.navigate("Settings")} className="mt-6" />
    </AppShell>
  );
}
