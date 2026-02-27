import { create } from 'zustand'

type UIStore = {
  settingsOpen: boolean
  settingsInitialSection: string | null
  openSettings: (section?: string) => void
  closeSettings: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  settingsOpen: false,
  settingsInitialSection: null,
  openSettings: (section) => set({ settingsOpen: true, settingsInitialSection: section ?? null }),
  closeSettings: () => set({ settingsOpen: false, settingsInitialSection: null }),
}))
