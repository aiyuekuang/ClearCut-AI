// Provider IPC handlers - bridges renderer <-> main process
// Handles provider listing, auth management, connection testing, model selection

import { ipcMain } from 'electron'
import type { ProviderAuth } from '../../src/types/provider'
import { PRESET_PROVIDERS, getProviderById } from '../providers/registry'
import {
  getProviderAuth,
  setProviderAuth,
  deleteProviderAuth,
  getDefaultModel,
  setDefaultModel,
  getActiveProvider,
  setActiveProvider,
  getAllProviderStatuses,
} from '../providers/store'
import { createLLMClient } from '../providers/llm-client'

export function registerProviderIPC() {
  // List all preset providers
  ipcMain.handle('provider:list', () => {
    return PRESET_PROVIDERS
  })

  // Get all provider statuses (configured/unconfigured, masked keys, etc.)
  ipcMain.handle('provider:statuses', () => {
    return getAllProviderStatuses()
  })

  // Save provider authentication (API key + optional base URL)
  ipcMain.handle('provider:save-auth', (_event, auth: ProviderAuth) => {
    try {
      setProviderAuth(auth)
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })

  // Delete provider authentication
  ipcMain.handle('provider:delete-auth', (_event, providerId: string) => {
    try {
      deleteProviderAuth(providerId)
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })

  // Test provider connection with given or stored credentials
  ipcMain.handle(
    'provider:test',
    async (_event, providerId: string, apiKey?: string, baseUrl?: string) => {
      try {
        const provider = getProviderById(providerId)
        if (!provider) return { ok: false, error: '未找到该提供商' }

        // Use provided key or fall back to stored key
        const storedAuth = getProviderAuth(providerId)
        const key = apiKey || storedAuth?.apiKey
        if (!key) return { ok: false, error: '未提供 API Key' }

        const url = baseUrl || storedAuth?.baseUrl || provider.baseUrl
        const model = getDefaultModel(providerId) || provider.models[0]?.id

        if (!model) return { ok: false, error: '未找到可用模型' }

        const client = createLLMClient({
          sdkType: provider.sdkType,
          apiKey: key,
          baseUrl: url,
          model,
        })

        await client.testConnection()
        return { ok: true }
      } catch (e: any) {
        return { ok: false, error: e.message || '连接测试失败' }
      }
    },
  )

  // Set default model for a provider
  ipcMain.handle(
    'provider:set-default-model',
    (_event, providerId: string, modelId: string) => {
      try {
        setDefaultModel(providerId, modelId)
        return { ok: true }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    },
  )

  // Set globally active provider + model
  ipcMain.handle(
    'provider:set-active',
    (_event, providerId: string, model: string) => {
      try {
        setActiveProvider(providerId, model)
        return { ok: true }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    },
  )

  // Get currently active provider + model
  ipcMain.handle('provider:get-active', () => {
    return getActiveProvider()
  })
}
