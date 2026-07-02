import { create } from "zustand";

import type { StationSummary } from "@/components/StationCard";
import * as stationService from "@/services/stationService";
import type { ArrivalIntentInput, CheckInInput } from "@/lib/validation";
import type { ChargingStation, StationPresence } from "@/types/domain";

interface StationState {
  stations: ChargingStation[];
  summaries: StationSummary[];
  presenceByStation: Record<string, StationPresence[]>;
  loading: boolean;
  error: string | null;
  loadStations: () => Promise<void>;
  loadStationPresence: (stationId: string) => Promise<void>;
  submitCheckIn: (input: CheckInInput) => Promise<void>;
  submitArrivalIntent: (input: ArrivalIntentInput) => Promise<void>;
  checkOut: () => Promise<void>;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Station action failed.";
}

export const useStationStore = create<StationState>((set, get) => ({
  stations: [],
  summaries: [],
  presenceByStation: {},
  loading: false,
  error: null,

  async loadStations() {
    set({ loading: true, error: null });
    try {
      const [stations, summaries] = await Promise.all([
        stationService.fetchStations(),
        stationService.fetchStationSummaries()
      ]);
      set({ stations, summaries, loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  async loadStationPresence(stationId) {
    set({ loading: true, error: null });
    try {
      const presence = await stationService.fetchStationPresence(stationId);
      set({
        presenceByStation: { ...get().presenceByStation, [stationId]: presence },
        loading: false
      });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  async submitCheckIn(input) {
    set({ loading: true, error: null });
    try {
      await stationService.checkIn(input);
      await get().loadStationPresence(input.station_id);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  async submitArrivalIntent(input) {
    set({ loading: true, error: null });
    try {
      await stationService.markOnTheWay(input);
      await get().loadStationPresence(input.station_id);
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  async checkOut() {
    set({ loading: true, error: null });
    try {
      await stationService.checkOutActive();
      set({ loading: false });
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error) });
      throw error;
    }
  }
}));
