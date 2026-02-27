// Settings IPC handlers - general app settings
// Manages user preferences for ASR, subtitle defaults, export, etc.

import { ipcMain, dialog } from 'electron'
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
  // AI engine mode
  'ai.mode': 'local',

  // AI capability slots (auto-set when ai.mode changes)
  'ai.slots.filler': 'local-llm',
  'ai.slots.sentence': 'local-llm',
  'ai.slots.highlight': 'rules',
  'ai.slots.analysis': 'local-llm',
  'ai.slots.summary': 'local-llm',

  // ASR (always local, independent of ai.mode)
  'asr.language': 'zh',
  'asr.engine': 'funasr',
  'asr.modelQuality': 'large',

  // Smart editing
  'edit.silenceThreshold': -35,
  'edit.minSilenceDuration': 0.8,
  'edit.fillerWords': ['嗯', '啊', '那个', '然后', '就是', '就是说', '对对对', '这个'],
  'edit.fillerPrompt': '你是一个视频剪辑助手，帮助口播视频创作者去除废话。\n\n请分析以下编号词语列表（来自中文口播视频转录），找出所有废话词：\n- 语气词：嗯、啊、哦、呢、吧、哈、哎、唉\n- 填充词：那个、然后、就是、就是说、对对对、这个\n- 无意义重复：同一语义连续重复出现\n\n请只返回 JSON 格式，不要有任何其他内容：{"indices": [废话词的序号列表]}',

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

  // Open native directory picker dialog
  ipcMain.handle('settings:select-dir', async (event) => {
    const win = require('electron').BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || !result.filePaths.length) {
      return { ok: false }
    }
    return { ok: true, path: result.filePaths[0] }
  })
}
