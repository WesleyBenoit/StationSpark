import * as Location from "expo-location";
import { useEffect, useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { InviteCard } from "@/components/InviteCard";
import { MapViewWrapper } from "@/components/MapViewWrapper";
import { StationCard } from "@/components/StationCard";
import type { RootStackParamList } from "@/navigation/types";
import { fetchChatByInvite } from "@/services/chatService";
import { useAuthStore } from "@/stores/authStore";
import { useInviteStore } from "@/stores/inviteStore";
import { useStationStore } from "@/stores/stationStore";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function HomeMapScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const stations = useStationStore((state) => state.stations);
  const summaries = useStationStore((state) => state.summaries);
  const loadStations = useStationStore((state) => state.loadStations);
  const invites = useInviteStore((state) => state.invites);
  const loadInvites = useInviteStore((state) => state.loadInvites);
  const acceptInvite = useInviteStore((state) => state.acceptInvite);
  const declineInvite = useInviteStore((state) => state.declineInvite);
  const cancelInvite = useInviteStore((state) => state.cancelInvite);
  const [locationPermission, setLocationPermission] = useState<"unknown" | "granted" | "denied">("unknown");

  useEffect(() => {
    void loadStations();
    void loadInvites();
    void Location.requestForegroundPermissionsAsync().then((result) => {
      setLocationPermission(result.status === "granted" ? "granted" : "denied");
    });
  }, [loadInvites, loadStations]);

  const summaryByStation = useMemo(
    () => Object.fromEntries(summaries.map((summary) => [summary.station_id, summary])),
    [summaries]
  );

  const recentInvites = invites.slice(0, 3);

  const openAcceptedInvite = async (inviteId: string) => {
    try {
      const chat = await fetchChatByInvite(inviteId);
      if (!chat) throw new Error("Chat is not ready yet.");
      navigation.navigate("Chat", { chatId: chat.id });
    } catch (error) {
      Alert.alert("Chat unavailable", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <AppShell>
      <Header
        title="StationSpark"
        subtitle="Station-level EV driver discovery"
        rightLabel="On my way"
        onRightPress={() => navigation.navigate("OnTheWay")}
      />

      {locationPermission === "denied" ? (
        <View className="mb-4 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4">
          <Text className="text-sm leading-5 text-yellow-100">
            Location permission is off. You can still browse stations manually.
          </Text>
        </View>
      ) : null}

      {stations.length ? (
        <MapViewWrapper
          stations={stations}
          onStationPress={(station) => navigation.navigate("StationDetail", { stationId: station.id })}
        />
      ) : (
        <EmptyState title="No stations yet" body="Load demo seed data or add charging stations in Supabase." />
      )}

      <View className="mt-5 flex-row gap-3">
        <Button title="Check in" className="flex-1" onPress={() => navigation.navigate("MainTabs", { screen: "CheckIn" })} />
        <Button
          title="Safety"
          variant="secondary"
          className="flex-1"
          onPress={() => navigation.navigate("MainTabs", { screen: "Safety" })}
        />
      </View>

      {recentInvites.length ? (
        <View className="mt-6 gap-4">
          <Text className="text-xl font-bold text-white">Invites</Text>
          {recentInvites.map((invite) => (
            <InviteCard
              key={invite.id}
              invite={invite}
              direction={invite.sender_id === user?.id ? "sent" : "received"}
              onAccept={async () => {
                const chat = await acceptInvite(invite.id);
                navigation.navigate("Chat", { chatId: chat.id });
              }}
              onDecline={() => declineInvite(invite.id)}
              onCancel={() => cancelInvite(invite.id)}
              onOpenChat={() => openAcceptedInvite(invite.id)}
            />
          ))}
        </View>
      ) : null}

      <View className="mt-6 gap-4">
        <Text className="text-xl font-bold text-white">Nearby charging stations</Text>
        {stations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            summary={summaryByStation[station.id]}
            onPress={() => navigation.navigate("StationDetail", { stationId: station.id })}
          />
        ))}
      </View>
    </AppShell>
  );
}
