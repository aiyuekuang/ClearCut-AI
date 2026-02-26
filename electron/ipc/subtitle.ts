// Subtitle IPC handlers
// Proxies subtitle generation and styling to the Python sidecar

import { ipcMain, dialog, BrowserWindow } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { sidecarRequest, isSidecarReady } from '../sidecar'
import type { WordSegment } from './transcript'

export function registerSubtitleIPC() {
  // Generate ASS/SRT subtitle file from word segments + template
  ipcMain.handle(
    'subtitle:generate',
    async (
      _event,
      params: {
        words: WordSegment[]
        templateId: string
        outputDir: string
        format: 'ass' | 'srt' | 'both'
        wordsPerLine?: number
        maxLineWidth?: number
      },
    ) => {
      if (!isSidecarReady()) return { ok: false, error: 'AI 引擎未就绪' }

      try {
        const result = await sidecarRequest<{
          ass_path?: string
          srt_path?: string
        }>('POST', '/subtitle/generate', params)

        return { ok: true, ...result }
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    },
  )

  // Preview subtitle frame as base64 image (for real-time style preview)
  ipcMain.handle(
    'subtitle:preview',
    async (
      _event,
      params: {
        text: string
        templateId: string
        width?: number
        height?: number
      },
    ) => {
      if (!isSidecarReady()) return { ok: false, error: 'AI 引擎未就绪' }
      try {
        const result = await sidecarRequest<{ image_base64: string }>(
          'POST',
          '/subtitle/preview',
          params,
        )
        return { ok: true, imageBase64: result.image_base64 }
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    },
  )

  // Export subtitle file (SRT or ASS) via save dialog
  ipcMain.handle(
    'subtitle:export-dialog',
    async (
      event,
      params: {
        content: string
        format: 'srt' | 'ass'
        defaultName?: string
      },
    ) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) return { canceled: true }

      const ext = params.format
      const result = await dialog.showSaveDialog(win, {
        title: `导出 ${ext.toUpperCase()} 字幕`,
        defaultPath: params.defaultName ?? `subtitle.${ext}`,
        filters: [
          { name: `${ext.toUpperCase()} 字幕`, extensions: [ext] },
          { name: '所有文件', extensions: ['*'] },
        ],
      })

      if (result.canceled || !result.filePath) {
        return { canceled: true }
      }

      fs.writeFileSync(result.filePath, params.content, 'utf-8')
      return { ok: true, filePath: result.filePath }
    },
  )

  // Read subtitle file content
  ipcMain.handle('subtitle:read', (_event, filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return { ok: true, content }
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  })
}
