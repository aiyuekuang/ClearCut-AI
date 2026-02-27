// Transcript IPC handlers
// Proxies ASR requests to the Python sidecar

import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { sidecarRequest, isSidecarReady } from '../sidecar'
import { getActiveProvider, getProviderAuth } from '../providers/store'
import { getProviderById } from '../providers/registry'
import { createLLMClient } from '../providers/llm-client'
import { isModelDownloaded, detectFillersLocal } from '../providers/local-llm'

// Load settings synchronously for slot routing
function loadSettingsSync(): Record<string, unknown> {
  try {
    const settingsFile = path.join(app.getPath('userData'), 'config', 'settings.json')
    if (fs.existsSync(settingsFile)) {
      return JSON.parse(fs.readFileSync(settingsFile, 'utf-8'))
    }
  } catch {
    // ignore
  }
  return {}
}

const DEFAULT_FILLER_PROMPT = `你是一个视频剪辑助手，帮助口播视频创作者去除废话。

请分析以下编号词语列表（来自中文口播视频转录），找出所有废话词：
- 语气词：嗯、啊、哦、呢、吧、哈、哎、唉
- 填充词：那个、然后、就是、就是说、对对对、这个
- 无意义重复：同一语义连续重复出现

请只返回 JSON 格式，不要有任何其他内容：{"indices": [废话词的序号列表]}`

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
          {
            audio_path: params.audioPath,
            project_id: params.projectId,
            language: params.language ?? 'zh',
            engine: params.engine ?? 'funasr',
            model_quality: params.modelQuality ?? 'large',
          },
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
          {
            words: params.words,
            filler_list: params.fillerList,
          },
        )
        return { ok: true, fillerIndices: result.filler_indices }
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    },
  )

  // LLM-based filler word detection
  // Reads ai.slots.filler setting to determine which method to use
  ipcMain.handle(
    'transcript:detect-fillers-llm',
    async (
      _event,
      params: {
        words: WordSegment[]
        prompt?: string
      },
    ) => {
      try {
        // Read the configured slot method
        const settings = loadSettingsSync()
        const method = (settings['ai.slots.filler'] as string) || 'local-llm'
        console.log('[IPC:detect-fillers-llm] method=', method, 'words=', params.words.length)

        // Route to the appropriate implementation
        switch (method) {
          case 'dictionary': {
            console.log('[IPC:detect-fillers-llm] => 字典模式')
            // Delegate to the dictionary-based detection (sidecar)
            if (!isSidecarReady()) return { ok: false, error: 'AI 引擎未就绪' }
            const fillerList = settings['edit.fillerWords'] as string[] | undefined
            const result = await sidecarRequest<{ filler_indices: number[] }>(
              'POST',
              '/transcribe/detect-fillers',
              { words: params.words, filler_list: fillerList },
            )
            console.log('[IPC:detect-fillers-llm] 字典结果=', result)
            return { ok: true, fillerIndices: result.filler_indices, source: 'dictionary' }
          }

          case 'local-llm': {
            console.log('[IPC:detect-fillers-llm] => 本地 LLM 模式, 模型已下载=', isModelDownloaded())
            if (!isModelDownloaded()) {
              return { ok: false, error: '本地模型未下载，请前往设置 → AI 引擎下载' }
            }
            const indices = await detectFillersLocal(params.words, params.prompt)
            console.log('[IPC:detect-fillers-llm] 本地 LLM 结果 indices=', indices)
            return { ok: true, fillerIndices: indices, source: 'local' }
          }

          case 'api-llm': {
            const active = getActiveProvider()
            console.log('[IPC:detect-fillers-llm] => API LLM 模式, activeProvider=', active)
            if (!active) return { ok: false, error: '请先配置 API 提供商' }

            const auth = getProviderAuth(active.providerId)
            console.log('[IPC:detect-fillers-llm] auth=', {
              providerId: auth?.providerId,
              mode: auth?.mode,
              hasApiKey: !!auth?.apiKey,
              hasAccessToken: !!auth?.accessToken,
              baseUrl: auth?.baseUrl,
            })
            // OAuth 提供商使用 accessToken，API Key 提供商使用 apiKey
            const token = auth?.apiKey || auth?.accessToken
            if (!token) {
              console.error('[IPC:detect-fillers-llm] ❌ 未找到可用 token，返回错误')
              return { ok: false, error: 'API Key / AccessToken 未配置' }
            }

            const providerConfig = getProviderById(active.providerId)
            console.log('[IPC:detect-fillers-llm] providerConfig=', providerConfig ? { id: providerConfig.id, sdkType: providerConfig.sdkType, baseUrl: providerConfig.baseUrl } : null)
            if (!providerConfig) return { ok: false, error: '提供商配置不存在' }

            const client = createLLMClient({
              sdkType: providerConfig.sdkType,
              apiKey: token,
              baseUrl: auth.baseUrl || providerConfig.baseUrl,
              model: active.model,
            })

            const wordList = params.words.map((w, i) => `${i}. ${w.word}`).join('\n')
            const systemPrompt = params.prompt?.trim() || DEFAULT_FILLER_PROMPT
            console.log('[IPC:detect-fillers-llm] 调用 API, model=', active.model, 'provider=', active.providerId)

            const response = await client.chat(
              [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `词语列表：\n${wordList}` },
              ],
              { temperature: 0.1, maxTokens: 1024 },
            )

            const content = response.content.trim()
            console.log('[IPC:detect-fillers-llm] API 原始响应=', content.slice(0, 200))
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (!jsonMatch) return { ok: false, error: `模型响应格式错误: ${content.slice(0, 100)}` }

            const parsed = JSON.parse(jsonMatch[0]) as { indices?: unknown }
            const indices = Array.isArray(parsed.indices)
              ? parsed.indices.filter(
                  (i): i is number =>
                    typeof i === 'number' && i >= 0 && i < params.words.length,
                )
              : []

            console.log('[IPC:detect-fillers-llm] API 解析结果 indices=', indices)
            return { ok: true, fillerIndices: indices, source: 'api' }
          }

          default:
            return { ok: false, error: `未知的废话检测方法: ${method}` }
        }
      } catch (e: unknown) {
        console.error('[IPC:detect-fillers-llm] 异常:', e)
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
        }>('POST', '/transcribe/detect-silence', {
          audio_path: params.audioPath,
          threshold: params.threshold ?? -35,
          min_duration: params.minDuration ?? 0.8,
        })
        return { ok: true, silenceSegments: result.silence_segments }
      } catch (e: unknown) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    },
  )
}
