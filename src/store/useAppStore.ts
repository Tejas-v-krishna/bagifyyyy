import { create } from 'zustand';

interface AppState {
  isPreloaderFinished: boolean;
  setPreloaderFinished: (finished: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isPreloaderFinished: false,
  setPreloaderFinished: (finished) => set({ isPreloaderFinished: finished }),
}));
