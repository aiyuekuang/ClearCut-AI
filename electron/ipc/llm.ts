// Local LLM IPC handlers
// Manages model download, status, and deletion for the built-in Qwen2.5 model

import { ipcMain } from 'electron'
import {
  isModelDownloaded,
  downloadModel,
  cancelDownload,
  deleteModel,
  LOCAL_MODEL_INFO,
} from '../providers/local-llm'

export function registerLLMIPC() {
  // Get local model status
  ipcMain.handle('llm:model-status', () => {
    return {
      downloaded: isModelDownloaded(),
      info: LOCAL_MODEL_INFO,
    }
  })

  // Download model — sends progress events back to the caller's webContents
  ipcMain.handle('llm:download-model', async (event) => {
    try {
      await downloadModel((progress) => {
        // Send progress to the renderer that triggered the download
        event.sender.send('llm:download-progress', progress)
      })
      return { ok: true }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      return { ok: false, error: msg }
    }
  })

  // Cancel in-progress download
  ipcMain.handle('llm:cancel-download', () => {
    cancelDownload()
    return { ok: true }
  })

  // Delete downloaded model from disk
  ipcMain.handle('llm:delete-model', () => {
    deleteModel()
    return { ok: true }
  })
}
