// Transcript IPC handlers
// Proxies ASR requests to the Python sidecar

import { ipcMain } from 'electron'
import { sidecarRequest, isSidecarReady } from '../sidecar'

export type WordSegment = {
  word: string
  start: number  // seconds
  end: number
  confidence: number
}

export type TranscriptResult = {
  text: string
  language: string
  words: WordSegment[]
  segments: Array<{
    id: number
    start: number
    end: number
    text: string
    words: WordSegment[]
  }>
}

export function registerTranscriptIPC() {
  // Start ASR transcription job
  ipcMain.handle(
    'transcript:start',
    async (
      _event,
      params: {
        audioPath: string
        projectId: string
        language?: string   // 'zh' | 'en' | 'auto'
        engine?: string     // 'funasr' | 'whisper'
        modelQuality?: string // 'large' | 'medium' | 'small'
      },
    ) => {
      if (!isSidecarReady()) {
        return { ok: false, error: 'AI 引擎未就绪，请稍候' }
      }

      try {
        const result = await sidecarRequest<{ job_id: string }>(
          'POST',
          '/transcribe/start',
          params,
        )
        return { ok: true, jobId: result.job_id }
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    },
  )

  // Poll transcription job status
  ipcMain.handle('transcript:status', async (_event, jobId: string) => {
    if (!isSidecarReady()) return { ok: false, status: 'error', error: 'AI 引擎未就绪' }

    try {
      const result = await sidecarRequest<{
        status: 'pending' | 'processing' | 'done' | 'error'
        progress?: number
        result?: TranscriptResult
        error?: string
      }>('GET', `/transcribe/status/${jobId}`)

      return { ok: true, ...result }
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  })

  // Cancel a running job
  ipcMain.handle('transcript:cancel', async (_event, jobId: string) => {
    if (!isSidecarReady()) return { ok: false }
    try {
      await sidecarRequest('DELETE', `/transcribe/jobs/${jobId}`)
      return { ok: true }
    } catch {
      return { ok: false }
    }
  })

  // Detect filler words in transcript
  ipcMain.handle(
    'transcript:detect-fillers',
    async (
      _event,
      params: {
        words: WordSegment[]
        fillerList?: string[]
      },
    ) => {
      if (!isSidecarReady()) return { ok: false, error: 'AI 引擎未就绪' }
      try {
        const result = await sidecarRequest<{ filler_indices: number[] }>(
          'POST',
          '/transcribe/detect-fillers',
          params,
        )
        return { ok: true, fillerIndices: result.filler_indices }
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    },
  )

  // Detect silence segments in audio
  ipcMain.handle(
    'transcript:detect-silence',
    async (
      _event,
      params: {
        audioPath: string
        threshold?: number   // dB, default -35
        minDuration?: number // seconds, default 0.8
      },
    ) => {
      if (!isSidecarReady()) return { ok: false, error: 'AI 引擎未就绪' }
      try {
        const result = await sidecarRequest<{
          silence_segments: Array<{ start: number; end: number }>
        }>('POST', '/transcribe/detect-silence', params)
        return { ok: true, silenceSegments: result.silence_segments }
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    },
  )
}
