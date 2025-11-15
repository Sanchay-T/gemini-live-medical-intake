import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ApiKeyStore {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  hasApiKey: () => boolean;
}

export const useApiKeyStore = create<ApiKeyStore>()(
  persist(
    (set, get) => ({
      apiKey: null,

      setApiKey: (key: string) => {
        set({ apiKey: key });
      },

      clearApiKey: () => {
        set({ apiKey: null });
      },

      hasApiKey: () => {
        const { apiKey } = get();
        return apiKey !== null && apiKey.trim().length > 0;
      },
    }),
    {
      name: 'medical-intake-api-key', // localStorage key
    }
  )
);
