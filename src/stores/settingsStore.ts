// Settings Zustand store - manages provider state for the renderer
// Fetches data from main process via IPC bridge (window.api.provider)

import { create } from 'zustand'
import type { ProviderConfig, ProviderStatus, ProviderAuth } from '../types/provider'

interface SettingsState {
  // Data
  providers: ProviderConfig[]
  statuses: ProviderStatus[]
  activeProvider: { providerId: string; model: string } | null
  loading: boolean

  // Actions
  fetchProviders: () => Promise<void>
  fetchStatuses: () => Promise<void>
  fetchActive: () => Promise<void>
  refreshAll: () => Promise<void>
  saveAuth: (auth: ProviderAuth) => Promise<{ ok: boolean; error?: string }>
  deleteAuth: (providerId: string) => Promise<{ ok: boolean }>
  testProvider: (
    providerId: string,
    apiKey?: string,
    baseUrl?: string,
  ) => Promise<{ ok: boolean; error?: string }>
  setDefaultModel: (providerId: string, modelId: string) => Promise<{ ok: boolean }>
  setActive: (providerId: string, model: string) => Promise<{ ok: boolean }>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  providers: [],
  statuses: [],
  activeProvider: null,
  loading: false,

  fetchProviders: async () => {
    const providers = await window.api.provider.list()
    set({ providers })
  },

  fetchStatuses: async () => {
    const statuses = await window.api.provider.statuses()
    set({ statuses })
  },

  fetchActive: async () => {
    const activeProvider = await window.api.provider.getActive()
    set({ activeProvider })
  },

  refreshAll: async () => {
    set({ loading: true })
    try {
      const [providers, statuses, activeProvider] = await Promise.all([
        window.api.provider.list(),
        window.api.provider.statuses(),
        window.api.provider.getActive(),
      ])
      set({ providers, statuses, activeProvider })
    } finally {
      set({ loading: false })
    }
  },

  saveAuth: async (auth) => {
    const result = await window.api.provider.saveAuth(auth)
    if (result.ok) await get().fetchStatuses()
    return result
  },

  deleteAuth: async (providerId) => {
    const result = await window.api.provider.deleteAuth(providerId)
    if (result.ok) {
      await get().fetchStatuses()
      await get().fetchActive()
    }
    return result
  },

  testProvider: async (providerId, apiKey?, baseUrl?) => {
    return window.api.provider.test(providerId, apiKey, baseUrl)
  },

  setDefaultModel: async (providerId, modelId) => {
    const result = await window.api.provider.setDefaultModel(providerId, modelId)
    if (result.ok) await get().fetchStatuses()
    return result
  },

  setActive: async (providerId, model) => {
    const result = await window.api.provider.setActive(providerId, model)
    if (result.ok) {
      set({ activeProvider: { providerId, model } })
    }
    return result
  },
}))
