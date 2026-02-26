// Provider auth & config persistence
// Stores API keys and model selection to ~/.clearcut-ai/config/

import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import type { ProviderAuth, ProviderStatus } from '../../src/types/provider'
import { getProviderById, PRESET_PROVIDERS } from './registry'

const CONFIG_DIR = path.join(app?.getPath('userData') || '', 'config')
const PROVIDERS_FILE = path.join(CONFIG_DIR, 'providers.json')
const DEFAULTS_FILE = path.join(CONFIG_DIR, 'defaults.json')

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

// --- Provider Auth ---

function loadProviderAuths(): Record<string, ProviderAuth> {
  try {
    if (fs.existsSync(PROVIDERS_FILE)) {
      return JSON.parse(fs.readFileSync(PROVIDERS_FILE, 'utf-8'))
    }
  } catch {
    // ignore parse errors
  }
  return {}
}

function saveProviderAuths(auths: Record<string, ProviderAuth>) {
  ensureDir()
  fs.writeFileSync(PROVIDERS_FILE, JSON.stringify(auths, null, 2))
}

export function getProviderAuth(providerId: string): ProviderAuth | null {
  const auths = loadProviderAuths()
  return auths[providerId] || null
}

export function setProviderAuth(auth: ProviderAuth): void {
  const auths = loadProviderAuths()
  auths[auth.providerId] = auth
  saveProviderAuths(auths)
}

export function deleteProviderAuth(providerId: string): void {
  const auths = loadProviderAuths()
  delete auths[providerId]
  saveProviderAuths(auths)
}

// --- Default Model ---

function loadDefaults(): Record<string, string> {
  try {
    if (fs.existsSync(DEFAULTS_FILE)) {
      return JSON.parse(fs.readFileSync(DEFAULTS_FILE, 'utf-8'))
    }
  } catch {
    // ignore parse errors
  }
  return {}
}

function saveDefaults(defaults: Record<string, string>) {
  ensureDir()
  fs.writeFileSync(DEFAULTS_FILE, JSON.stringify(defaults, null, 2))
}

export function getDefaultModel(providerId: string): string | null {
  return loadDefaults()[providerId] || null
}

export function setDefaultModel(providerId: string, modelId: string): void {
  const defaults = loadDefaults()
  defaults[providerId] = modelId
  saveDefaults(defaults)
}

/** Get the globally active provider + model */
export function getActiveProvider(): { providerId: string; model: string } | null {
  const defaults = loadDefaults()
  const activeId = defaults['__active_provider__']
  const activeModel = defaults['__active_model__']
  if (activeId && activeModel) return { providerId: activeId, model: activeModel }

  // Fallback: find first configured provider
  const auths = loadProviderAuths()
  for (const [id, auth] of Object.entries(auths)) {
    if (auth.apiKey) {
      const provider = getProviderById(id)
      const model = defaults[id] || provider?.models[0]?.id
      if (model) return { providerId: id, model }
    }
  }
  return null
}

export function setActiveProvider(providerId: string, model: string): void {
  const defaults = loadDefaults()
  defaults['__active_provider__'] = providerId
  defaults['__active_model__'] = model
  saveDefaults(defaults)
}

// --- Provider Status (for frontend) ---

export function getAllProviderStatuses(): ProviderStatus[] {
  const auths = loadProviderAuths()
  const defaults = loadDefaults()

  return PRESET_PROVIDERS.map((p) => {
    const auth = auths[p.id]
    const configured = !!(auth?.apiKey)
    return {
      providerId: p.id,
      configured,
      authMode: auth?.mode,
      maskedKey: auth?.apiKey ? maskKey(auth.apiKey) : undefined,
      baseUrl: auth?.baseUrl,
      defaultModel: defaults[p.id] || p.models[0]?.id,
    }
  })
}

function maskKey(key: string): string {
  if (key.length <= 8) return '****'
  return key.substring(0, 8) + '...****'
}
