// Global type declarations for window.api exposed by preload

import type { ProviderAPI, OAuthAPI } from './provider'

declare global {
  interface Window {
    api: {
      app: {
        openExternal(url: string): Promise<void>
        onSidecarError(callback: (msg: string) => void): () => void
      }
      provider: ProviderAPI
      oauth: OAuthAPI
      project: {
        importDialog(): Promise<{ ok: boolean; filePath?: string; canceled?: boolean; error?: string }>
        create(filePath: string, name?: string): Promise<{ ok: boolean; project?: unknown; error?: string }>
        list(): Promise<unknown[]>
        get(projectId: string): Promise<unknown>
        delete(projectId: string): Promise<{ ok: boolean; error?: string }>
        saveTranscript(projectId: string, result: unknown): Promise<{ ok: boolean; error?: string }>
        loadTranscript(projectId: string): Promise<unknown>
      }
      settings: {
        get(key: string): Promise<unknown>
        set(key: string, value: unknown): Promise<{ ok: boolean }>
        getAll(): Promise<Record<string, unknown>>
        setMany(entries: Record<string, unknown>): Promise<{ ok: boolean }>
        reset(key: string): Promise<{ ok: boolean; value: unknown }>
        resetAll(): Promise<{ ok: boolean }>
        selectDir(): Promise<{ ok: boolean; path?: string }>
      }
      video: {
        meta(filePath: string): Promise<{ ok: boolean; meta: { duration: number; width: number; height: number; fps: number; codec: string; size: number; bitrate: number }; error?: string }>
        extractAudio(filePath: string, projectId: string): Promise<{ ok: boolean; audioPath: string; error?: string }>
        export(params: unknown): Promise<{ ok: boolean; outputPath?: string; error?: string }>
        exportDialog(): Promise<{ canceled: boolean; filePath?: string }>
      }
      transcript: {
        start(params: unknown): Promise<{ ok: boolean; jobId?: string; error?: string }>
        status(jobId: string): Promise<{ ok: boolean; status: string; progress?: number; result?: { words: unknown[]; language: string }; error?: string }>
        cancel(jobId: string): Promise<{ ok: boolean }>
        detectFillers(params: unknown): Promise<{ ok: boolean; fillerIndices?: number[]; error?: string }>
        detectFillersLLM(params: unknown): Promise<{ ok: boolean; fillerIndices?: number[]; source?: string; error?: string }>
        detectSilence(params: unknown): Promise<{ ok: boolean; silenceSegments?: Array<{ start: number; end: number }>; error?: string }>
      }
      subtitle: {
        generate(params: unknown): Promise<{ ok: boolean; ass_path?: string; srt_path?: string; error?: string }>
        preview(params: unknown): Promise<{ ok: boolean; imageBase64?: string; error?: string }>
        exportDialog(params: unknown): Promise<{ canceled?: boolean; ok?: boolean; filePath?: string }>
        read(filePath: string): Promise<{ ok: boolean; content?: string; error?: string }>
      }
      llm: {
        modelStatus(): Promise<{ downloaded: boolean; info: { name: string; quantization: string; sizeMB: number; description: string; filename: string } }>
        downloadModel(): Promise<{ ok: boolean; error?: string }>
        cancelDownload(): Promise<void>
        deleteModel(): Promise<void>
        onDownloadProgress(callback: (progress: { downloaded: number; total: number; percent: number }) => void): () => void
      }
    }
  }
}

export {}
