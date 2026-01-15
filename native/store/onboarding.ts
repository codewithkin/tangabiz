// Onboarding store - tracks if user has completed onboarding
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Use the same MMKV instance
const storage = new MMKV({
  id: 'tangabiz-storage',
  encryptionKey: 'tangabiz-secure-key',
});

const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    storage.delete(name);
  },
};

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
    }),
    {
      name: 'tangabiz-onboarding',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
