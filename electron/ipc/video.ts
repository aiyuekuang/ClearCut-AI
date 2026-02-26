// Video IPC handlers
// Handles: get video metadata, extract audio for ASR, export final video

import { ipcMain, dialog, BrowserWindow } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

// Find ffmpeg/ffprobe from PATH or bundled resources
function findBin(name: string): string {
  // Try bundled first (production), then PATH (dev)
  return name
}

export type VideoMeta = {
  duration: number
  width: number
  height: number
  fps: number
  codec: string
  size: number
  bitrate: number
}

export function registerVideoIPC() {
  // Get video metadata via ffprobe
  ipcMain.handle('video:meta', async (_event, filePath: string) => {
    try {
      const { stdout } = await execFileAsync(findBin('ffprobe'), [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath,
      ])

      const info = JSON.parse(stdout) as {
        format: { duration: string; size: string; bit_rate: string }
        streams: Array<{
          codec_type: string
          codec_name: string
          width?: number
          height?: number
          r_frame_rate?: string
        }>
      }

      const videoStream = info.streams.find((s) => s.codec_type === 'video')
      const fpsStr = videoStream?.r_frame_rate ?? '30/1'
      const [num, den] = fpsStr.split('/').map(Number)

      const meta: VideoMeta = {
        duration: parseFloat(info.format.duration),
        width: videoStream?.width ?? 0,
        height: videoStream?.height ?? 0,
        fps: (num ?? 30) / (den ?? 1),
        codec: videoStream?.codec_name ?? 'unknown',
        size: parseInt(info.format.size),
        bitrate: parseInt(info.format.bit_rate),
      }
      return { ok: true, meta }
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  })

  // Extract audio from video for ASR
  ipcMain.handle('video:extract-audio', async (_event, filePath: string, projectId: string) => {
    try {
      const tempDir = path.join(os.tmpdir(), 'clearcut-ai', projectId)
      fs.mkdirSync(tempDir, { recursive: true })
      const audioPath = path.join(tempDir, 'audio.wav')

      // Skip re-extraction if audio file already exists
      if (fs.existsSync(audioPath)) {
        return { ok: true, audioPath }
      }

      // Extract as 16kHz mono WAV - optimal for ASR models
      await execFileAsync(findBin('ffmpeg'), [
        '-y',
        '-i', filePath,
        '-vn',
        '-ar', '16000',
        '-ac', '1',
        '-acodec', 'pcm_s16le',
        audioPath,
      ])

      return { ok: true, audioPath }
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  })

  // Export final video with optional subtitle burn-in
  ipcMain.handle(
    'video:export',
    async (
      event,
      params: {
        inputPath: string
        outputPath: string
        segments: Array<{ start: number; end: number }>
        subtitlePath?: string
        burnSubtitles?: boolean
        onProgress?: boolean
      },
    ) => {
      const { inputPath, outputPath, segments, subtitlePath, burnSubtitles } = params

      try {
        // Build concat filter from kept segments
        const filterParts: string[] = []
        const selectClauses = segments
          .map((s) => `between(t,${s.start},${s.end})`)
          .join('+')

        filterParts.push(`[0:v]select='${selectClauses}',setpts=N/FRAME_RATE/TB[v]`)
        filterParts.push(`[0:a]aselect='${selectClauses}',asetpts=N/SR/TB[a]`)

        const ffmpegArgs: string[] = ['-y', '-i', inputPath]

        if (burnSubtitles && subtitlePath) {
          // Use ASS subtitles filter for styled burn-in
          const escapedPath = subtitlePath.replace(/:/g, '\\:').replace(/'/g, "\\'")
          filterParts.push(`[v]ass='${escapedPath}'[vout]`)
          ffmpegArgs.push('-filter_complex', filterParts.join(';'))
          ffmpegArgs.push('-map', '[vout]', '-map', '[a]')
        } else {
          ffmpegArgs.push('-filter_complex', filterParts.join(';'))
          ffmpegArgs.push('-map', '[v]', '-map', '[a]')
        }

        ffmpegArgs.push('-c:v', 'libx264', '-crf', '18', '-preset', 'fast')
        ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k')
        ffmpegArgs.push(outputPath)

        await execFileAsync(findBin('ffmpeg'), ffmpegArgs)
        return { ok: true, outputPath }
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    },
  )

  // Show save dialog for export
  ipcMain.handle('video:export-dialog', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { canceled: true }

    const result = await dialog.showSaveDialog(win, {
      title: '导出视频',
      defaultPath: 'output.mp4',
      filters: [{ name: 'MP4 视频', extensions: ['mp4'] }],
    })
    return result
  })
}
