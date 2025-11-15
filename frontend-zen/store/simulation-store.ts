import { create } from 'zustand';
import { Scenario } from '@/types';

interface SimulationStore {
  selectedScenario: Scenario | null;
  isPlaying: boolean;
  currentExchangeIndex: number;

  selectScenario: (scenario: Scenario) => void;
  setPlaying: (playing: boolean) => void;
  nextExchange: () => void;
  previousExchange: () => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  selectedScenario: null,
  isPlaying: false,
  currentExchangeIndex: 0,

  selectScenario: (scenario) => set({
    selectedScenario: scenario,
    currentExchangeIndex: 0,
    isPlaying: false,
  }),

  setPlaying: (playing) => set({ isPlaying: playing }),

  nextExchange: () => set((state) => {
    if (!state.selectedScenario) return state;
    const maxIndex = state.selectedScenario.exchanges.length - 1;
    return {
      currentExchangeIndex: Math.min(state.currentExchangeIndex + 1, maxIndex),
    };
  }),

  previousExchange: () => set((state) => ({
    currentExchangeIndex: Math.max(state.currentExchangeIndex - 1, 0),
  })),

  reset: () => set({
    currentExchangeIndex: 0,
    isPlaying: false,
  }),
}));
