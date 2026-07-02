import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { UserCard } from "@/components/UserCard";
import { statusLabels } from "@/constants/options";
import type { RootStackParamList } from "@/navigation/types";
import { useAuthStore } from "@/stores/authStore";
import { useStationStore } from "@/stores/stationStore";

type Props = NativeStackScreenProps<RootStackParamList, "StationDetail">;

export function StationDetailScreen({ navigation, route }: Props) {
  const { stationId } = route.params;
  const user = useAuthStore((state) => state.user);
  const stations = useStationStore((state) => state.stations);
  const loadStations = useStationStore((state) => state.loadStations);
  const loadStationPresence = useStationStore((state) => state.loadStationPresence);
  const presence = useStationStore((state) => state.presenceByStation[stationId] ?? []);
  const station = stations.find((item) => item.id === stationId);

  useEffect(() => {
    if (!stations.length) void loadStations();
    void loadStationPresence(stationId);
  }, [loadStationPresence, loadStations, stationId, stations.length]);

  const stats = useMemo(() => {
    const charging = presence.filter((item) => item.presence_kind === "charging").length;
    const onWay = presence.filter((item) => item.presence_kind === "on_the_way").length;
    const recent = presence.filter((item) => item.presence_kind === "recently_active").length;
    const open = presence.filter((item) => ["open_to_chat", "networking", "talking_tesla"].includes(item.status)).length;
    const statuses = Array.from(new Set(presence.map((item) => item.status)));
    return { charging, onWay, recent, open, statuses };
  }, [presence]);

  return (
    <AppShell>
      <Header
        title={station?.name ?? "Station"}
        subtitle={station ? `${station.address}, ${station.city}` : "Loading station"}
        onBackPress={() => navigation.goBack()}
        rightLabel="Check in"
        onRightPress={() => navigation.navigate("MainTabs", { screen: "CheckIn" })}
      />

      <Card className="gap-4">
        <View className="flex-row flex-wrap gap-3">
          <Metric label="Charging" value={stats.charging} />
          <Metric label="On way" value={stats.onWay} />
          <Metric label="Recent" value={stats.recent} />
          <Metric label="Open" value={stats.open} />
        </View>
        <View className="flex-row flex-wrap gap-2">
          {stats.statuses.map((status) => (
            <Badge key={status} label={statusLabels[status]} tone={status === "do_not_disturb" ? "danger" : "accent"} />
          ))}
          {!stats.statuses.length ? <Badge label="No active categories" /> : null}
        </View>
        <Text className="text-sm leading-5 text-charge-muted">
          Presence is limited to this charging station. Exact vehicle position, license plate, and GPS coordinates are not shown.
        </Text>
      </Card>

      <View className="mt-6 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-white">Drivers here</Text>
          <Button title="Refresh" variant="ghost" onPress={() => loadStationPresence(stationId)} />
        </View>

        {presence.length ? (
          presence.map((item) => (
            <UserCard
              key={`${item.presence_kind}-${item.presence_id}`}
              presence={item}
              inviteDisabled={item.user_id === user?.id || item.status === "do_not_disturb"}
              onInvite={
                item.user_id === user?.id
                  ? undefined
                  : () => navigation.navigate("InviteComposer", { stationId, recipientId: item.user_id })
              }
              onReport={
                item.user_id === user?.id
                  ? undefined
                  : () => navigation.navigate("Report", { reportedUserId: item.user_id, stationId })
              }
            />
          ))
        ) : (
          <EmptyState
            title="No visible drivers"
            body="Drivers may be hidden, checked out, or not open to station presence right now."
            actionLabel="Check in"
            onAction={() => navigation.navigate("MainTabs", { screen: "CheckIn" })}
          />
        )}
      </View>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View className="min-w-[46%] flex-1 rounded-2xl bg-zinc-900 p-4">
      <Text className="text-2xl font-bold text-white">{value}</Text>
      <Text className="mt-1 text-xs text-charge-muted">{label}</Text>
    </View>
  );
}
