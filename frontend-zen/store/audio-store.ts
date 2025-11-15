import { create } from 'zustand';
import { VoiceState } from '@/types';

interface AudioStore {
  state: VoiceState;
  audioLevel: number;
  isConnected: boolean;
  error: string | null;

  setState: (state: VoiceState) => void;
  setAudioLevel: (level: number) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
  state: 'idle',
  audioLevel: 0,
  isConnected: false,
  error: null,

  setState: (state) => set({ state }),
  setAudioLevel: (level) => set({ audioLevel: level }),
  setConnected: (connected) => set({ isConnected: connected }),
  setError: (error) => set({ error }),

  reset: () => set({
    state: 'idle',
    audioLevel: 0,
    isConnected: false,
    error: null,
  }),
}));
