import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import type { ChargingStation } from "@/types/domain";

export interface StationSummary {
  station_id: string;
  charging_count: number;
  on_the_way_count: number;
  recently_active_count: number;
  open_to_chat_count: number;
  active_statuses: string[];
}

interface StationCardProps {
  station: ChargingStation;
  summary?: StationSummary;
  onPress?: () => void;
}

export function StationCard({ station, summary, onPress }: StationCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={!onPress}>
      <Card className="gap-4">
        <View className="flex-row">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15">
            <MaterialCommunityIcons name="ev-station" size={28} color="#2F80FF" />
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-lg font-bold text-white">{station.name}</Text>
            <Text className="mt-1 text-sm text-charge-muted">
              {station.address}, {station.city}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#A1A1AA" />
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Badge label={`${station.charger_count} chargers`} tone="accent" />
          <Badge label={station.charger_type} />
          <Badge label={station.provider} />
        </View>

        <View className="flex-row flex-wrap gap-3">
          <Metric label="Charging" value={summary?.charging_count ?? 0} />
          <Metric label="On way" value={summary?.on_the_way_count ?? 0} />
          <Metric label="Recent" value={summary?.recently_active_count ?? 0} />
          <Metric label="Open" value={summary?.open_to_chat_count ?? 0} />
        </View>
      </Card>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View className="min-w-[46%] flex-1 rounded-2xl bg-zinc-900 px-3 py-3">
      <Text className="text-xl font-bold text-white">{value}</Text>
      <Text className="mt-1 text-xs text-charge-muted">{label}</Text>
    </View>
  );
}
