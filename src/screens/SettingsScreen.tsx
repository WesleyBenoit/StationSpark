import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Text, View } from "react-native";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { premiumPlans } from "@/constants/options";
import type { RootStackParamList } from "@/navigation/types";
import { requestNotificationPermission } from "@/services/notificationService";
import { startCheckoutPlaceholder } from "@/services/subscriptionService";
import { useAuthStore } from "@/stores/authStore";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export function SettingsScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const startCheckout = async (planId: "monthly" | "yearly") => {
    const result = await startCheckoutPlaceholder(planId);
    Alert.alert("Subscription placeholder", result.message);
  };

  return (
    <AppShell>
      <Header title="Settings" subtitle={user?.email ?? "Account"} onBackPress={() => navigation.goBack()} />

      <Card className="gap-4">
        <Text className="text-lg font-bold text-white">Account</Text>
        <SettingRow label="Email" value={user?.email ?? "Not loaded"} />
        <SettingRow label="18+ confirmed" value={user?.is_18_plus ? "Yes" : "No"} />
        <SettingRow label="Phone verification" value={user?.phone_verified ? "Verified" : "Placeholder"} />
        <SettingRow label="Identity verification" value={user?.identity_verified ? "Verified" : "Placeholder"} />
      </Card>

      <Card className="mt-5 gap-4">
        <Text className="text-lg font-bold text-white">Notifications</Text>
        <Text className="text-sm leading-5 text-charge-muted">
          Push delivery is Phase 2. Permission handling is wired so accepted invites and chat alerts can be enabled later.
        </Text>
        <Button
          title="Enable notifications"
          variant="secondary"
          onPress={async () => {
            const result = await requestNotificationPermission();
            Alert.alert("Notifications", result.status === "granted" ? "Notifications are enabled." : "Notifications were not enabled.");
          }}
        />
      </Card>

      <Card className="mt-5 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-white">Subscription</Text>
          <Badge label="Stripe-ready" tone="accent" />
        </View>
        {premiumPlans.map((plan) => (
          <View key={plan.id} className="rounded-2xl bg-zinc-900 p-4">
            <Text className="text-base font-bold text-white">{plan.title}</Text>
            <Text className="mt-1 text-sm text-charge-muted">{plan.price}</Text>
            <Text className="mt-2 text-sm leading-5 text-zinc-300">{plan.features.join(" - ")}</Text>
            <Button title="Start checkout" variant="secondary" onPress={() => startCheckout(plan.id)} className="mt-3" />
          </View>
        ))}
      </Card>

      <Card className="mt-5 gap-3">
        <Text className="text-lg font-bold text-white">Policies</Text>
        <Button title="Terms" variant="secondary" onPress={() => Alert.alert("Terms", "Add production legal terms before launch.")} />
        <Button title="Safety policy" variant="secondary" onPress={() => Alert.alert("Safety policy", "Safety policy placeholder.")} />
        <Button title="Privacy" variant="secondary" onPress={() => Alert.alert("Privacy", "Privacy policy placeholder.")} />
      </Card>

      <View className="mt-6 gap-3">
        <Button title="Log out" variant="secondary" onPress={() => logout()} />
        <Button title="Delete account" variant="danger" onPress={() => Alert.alert("Delete account", "Deletion flow requires a backend Edge Function.")} />
      </View>
    </AppShell>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-zinc-900 p-4">
      <Text className="text-sm text-charge-muted">{label}</Text>
      <Text className="text-sm font-semibold text-white">{value}</Text>
    </View>
  );
}
