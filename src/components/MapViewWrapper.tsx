import MapboxGL from "@rnmapbox/maps";
import { useMemo } from "react";
import { Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { env } from "@/lib/env";
import type { ChargingStation } from "@/types/domain";

interface MapViewWrapperProps {
  stations: ChargingStation[];
  selectedStationId?: string;
  onStationPress?: (station: ChargingStation) => void;
}

export function MapViewWrapper({ stations, selectedStationId, onStationPress }: MapViewWrapperProps) {
  const center = useMemo(() => {
    const selected = stations.find((station) => station.id === selectedStationId) ?? stations[0];
    return selected ? { lat: selected.lat, lng: selected.lng } : { lat: 30.2672, lng: -97.7431 };
  }, [selectedStationId, stations]);

  if (env.mapboxToken) {
    MapboxGL.setAccessToken(env.mapboxToken);

    return (
      <View className="h-64 overflow-hidden rounded-2xl border border-zinc-800">
        <MapboxGL.MapView style={{ flex: 1 }} logoEnabled={false} attributionEnabled={false} styleURL={MapboxGL.StyleURL.Dark}>
          <MapboxGL.Camera zoomLevel={11} centerCoordinate={[center.lng, center.lat]} />
          {stations.map((station) => (
            <MapboxGL.PointAnnotation
              key={station.id}
              id={station.id}
              coordinate={[station.lng, station.lat]}
              onSelected={() => onStationPress?.(station)}
            >
              <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-charge-accent">
                <Text className="text-xs font-bold text-white">{station.charger_count}</Text>
              </View>
            </MapboxGL.PointAnnotation>
          ))}
        </MapboxGL.MapView>
      </View>
    );
  }

  return (
    <View className="h-64 overflow-hidden rounded-2xl border border-zinc-800">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: center.lat,
          longitude: center.lng,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15
        }}
      >
        {stations.map((station) => (
          <Marker
            key={station.id}
            coordinate={{ latitude: station.lat, longitude: station.lng }}
            title={station.name}
            description={station.address}
            onPress={() => onStationPress?.(station)}
          />
        ))}
      </MapView>
    </View>
  );
}
