// Subtitle store - manages subtitle template selection and style overrides

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SubtitleTemplate } from '@/config/subtitle-templates.config'

type SubtitleOverrides = Partial<SubtitleTemplate['style'] & SubtitleTemplate['animation']>

type SubtitleState = {
  selectedTemplateId: string
  overrides: SubtitleOverrides
  assPath: string | null
  srtPath: string | null
  generating: boolean
  error: string | null

  selectTemplate: (id: string) => void
  setOverride: <K extends keyof SubtitleOverrides>(key: K, value: SubtitleOverrides[K]) => void
  resetOverrides: () => void
  setGenerating: (v: boolean) => void
  setOutputPaths: (assPath: string | null, srtPath: string | null) => void
  setError: (error: string | null) => void
}

export const useSubtitleStore = create<SubtitleState>()(
  persist(
    (set) => ({
      selectedTemplateId: 'classic-white',
      overrides: {},
      assPath: null,
      srtPath: null,
      generating: false,
      error: null,

      selectTemplate: (id) => set({ selectedTemplateId: id, overrides: {}, assPath: null, srtPath: null }),
      setOverride: (key, value) =>
        set((s) => ({ overrides: { ...s.overrides, [key]: value } })),
      resetOverrides: () => set({ overrides: {} }),
      setGenerating: (v) => set({ generating: v, error: null }),
      setOutputPaths: (assPath, srtPath) => set({ assPath, srtPath }),
      setError: (error) => set({ error, generating: false }),
    }),
    { name: 'subtitle-prefs' },
  ),
)
