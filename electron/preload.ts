// Preload script - exposes safe IPC APIs to the renderer process
// Uses contextBridge to maintain process isolation

import { contextBridge, ipcRenderer } from 'electron'
import type { ProviderAuth } from '../src/types/provider'

const providerAPI = {
  list: () => ipcRenderer.invoke('provider:list'),
  statuses: () => ipcRenderer.invoke('provider:statuses'),
  saveAuth: (auth: ProviderAuth) => ipcRenderer.invoke('provider:save-auth', auth),
  deleteAuth: (providerId: string) => ipcRenderer.invoke('provider:delete-auth', providerId),
  test: (providerId: string, apiKey?: string, baseUrl?: string) =>
    ipcRenderer.invoke('provider:test', providerId, apiKey, baseUrl),
  setDefaultModel: (providerId: string, modelId: string) =>
    ipcRenderer.invoke('provider:set-default-model', providerId, modelId),
  setActive: (providerId: string, model: string) =>
    ipcRenderer.invoke('provider:set-active', providerId, model),
  getActive: () => ipcRenderer.invoke('provider:get-active'),
}

const projectAPI = {
  importDialog: () => ipcRenderer.invoke('project:import-dialog'),
  create: (filePath: string, name?: string) =>
    ipcRenderer.invoke('project:create', filePath, name),
  list: () => ipcRenderer.invoke('project:list'),
  get: (projectId: string) => ipcRenderer.invoke('project:get', projectId),
  delete: (projectId: string) => ipcRenderer.invoke('project:delete', projectId),
}

const settingsAPI = {
  get: (key: string) => ipcRenderer.invoke('settings:get', key),
  set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
  getAll: () => ipcRenderer.invoke('settings:getAll'),
  setMany: (entries: Record<string, unknown>) => ipcRenderer.invoke('settings:setMany', entries),
  reset: (key: string) => ipcRenderer.invoke('settings:reset', key),
  resetAll: () => ipcRenderer.invoke('settings:resetAll'),
}

const videoAPI = {
  meta: (filePath: string) => ipcRenderer.invoke('video:meta', filePath),
  extractAudio: (filePath: string, projectId: string) =>
    ipcRenderer.invoke('video:extract-audio', filePath, projectId),
  export: (params: unknown) => ipcRenderer.invoke('video:export', params),
  exportDialog: () => ipcRenderer.invoke('video:export-dialog'),
}

const transcriptAPI = {
  start: (params: unknown) => ipcRenderer.invoke('transcript:start', params),
  status: (jobId: string) => ipcRenderer.invoke('transcript:status', jobId),
  cancel: (jobId: string) => ipcRenderer.invoke('transcript:cancel', jobId),
  detectFillers: (params: unknown) => ipcRenderer.invoke('transcript:detect-fillers', params),
  detectSilence: (params: unknown) => ipcRenderer.invoke('transcript:detect-silence', params),
}

const subtitleAPI = {
  generate: (params: unknown) => ipcRenderer.invoke('subtitle:generate', params),
  preview: (params: unknown) => ipcRenderer.invoke('subtitle:preview', params),
  exportDialog: (params: unknown) => ipcRenderer.invoke('subtitle:export-dialog', params),
  read: (filePath: string) => ipcRenderer.invoke('subtitle:read', filePath),
}

contextBridge.exposeInMainWorld('api', {
  provider: providerAPI,
  project: projectAPI,
  settings: settingsAPI,
  video: videoAPI,
  transcript: transcriptAPI,
  subtitle: subtitleAPI,
})
