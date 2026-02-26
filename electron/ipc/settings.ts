// Settings IPC handlers - general app settings
// Manages user preferences for ASR, subtitle defaults, export, etc.

import { ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

const CONFIG_DIR = path.join(app?.getPath('userData') || '', 'config')
const SETTINGS_FILE = path.join(CONFIG_DIR, 'settings.json')

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function loadSettings(): Record<string, any> {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
    }
  } catch {
    // ignore
  }
  return {}
}

function saveSettings(settings: Record<string, any>) {
  ensureDir()
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

// Default settings values
const DEFAULTS: Record<string, any> = {
  // ASR
  'asr.language': 'zh',
  'asr.engine': 'funasr',
  'asr.modelQuality': 'large',

  // Smart editing
  'edit.silenceThreshold': -35,
  'edit.minSilenceDuration': 0.8,
  'edit.fillerWords': ['嗯', '啊', '那个', '然后', '就是', '就是说', '对对对', '这个'],

  // Subtitle
  'subtitle.defaultTemplate': 'classic-white',
  'subtitle.defaultFont': 'PingFang SC',
  'subtitle.defaultFontSize': 22,
  'subtitle.defaultFormat': 'srt',

  // Export
  'export.outputDir': '',
  'export.defaultFormat': 'mp4',
  'export.defaultResolution': 'original',
}

export function registerSettingsIPC() {
  // Get a single setting value
  ipcMain.handle('settings:get', (_event, key: string) => {
    const settings = loadSettings()
    return settings[key] ?? DEFAULTS[key] ?? null
  })

  // Set a single setting value
  ipcMain.handle('settings:set', (_event, key: string, value: any) => {
    const settings = loadSettings()
    settings[key] = value
    saveSettings(settings)
    return { ok: true }
  })

  // Get all settings (merged with defaults)
  ipcMain.handle('settings:getAll', () => {
    const settings = loadSettings()
    return { ...DEFAULTS, ...settings }
  })

  // Batch set multiple settings
  ipcMain.handle('settings:setMany', (_event, entries: Record<string, any>) => {
    const settings = loadSettings()
    Object.assign(settings, entries)
    saveSettings(settings)
    return { ok: true }
  })

  // Reset a specific setting to default
  ipcMain.handle('settings:reset', (_event, key: string) => {
    const settings = loadSettings()
    delete settings[key]
    saveSettings(settings)
    return { ok: true, value: DEFAULTS[key] ?? null }
  })

  // Reset all settings
  ipcMain.handle('settings:resetAll', () => {
    saveSettings({})
    return { ok: true }
  })
}
