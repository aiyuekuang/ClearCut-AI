// Local LLM service using node-llama-cpp
// Runs Qwen2.5-0.5B-Instruct (GGUF q4_K_M) entirely in-process
// No API key required, works offline after first download

import path from 'path'
import fs from 'fs'
import https from 'https'
import { app } from 'electron'
import type { Llama, LlamaModel } from 'node-llama-cpp'

const MODEL_DIR = path.join(app?.getPath('userData') || '', 'models')
const MODEL_FILENAME = 'qwen3-0.6b-q4_k_m.gguf'
// unsloth quantized version — smallest Q4_K_M build (397 MB)
const MODEL_URL =
  'https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q4_K_M.gguf'

export const LOCAL_MODEL_INFO = {
  name: 'Qwen3-0.6B',
  quantization: 'Q4_K_M',
  sizeMB: 397,
  description: '轻量中文内置模型，约 397 MB，无需 API Key，完全离线，推理能力优于上一代',
  filename: MODEL_FILENAME,
}

// ───────── State ─────────

let llamaInstance: Llama | null = null
let loadedModel: LlamaModel | null = null
let activeDownloadAbort: (() => void) | null = null

// ───────── Path helpers ─────────

export function getModelPath(): string {
  return path.join(MODEL_DIR, MODEL_FILENAME)
}

export function isModelDownloaded(): boolean {
  try {
    const stat = fs.statSync(getModelPath())
    return stat.size > 50_000_000 // > 50 MB = not a partial/corrupt file
  } catch {
    return false
  }
}

// ───────── Download ─────────

export type DownloadProgress = {
  downloaded: number
  total: number
  percent: number
}

export async function downloadModel(
  onProgress: (p: DownloadProgress) => void,
): Promise<void> {
  if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true })
  }

  const tmpPath = getModelPath() + '.tmp'

  return new Promise((resolve, reject) => {
    const doDownload = (url: string, redirectCount = 0): void => {
      if (redirectCount > 8) {
        reject(new Error('重定向次数过多'))
        return
      }

      const req = https.get(
        url,
        { headers: { 'User-Agent': 'ClearCut-AI/1.0' } },
        (res) => {
          if (
            res.statusCode === 301 ||
            res.statusCode === 302 ||
            res.statusCode === 307 ||
            res.statusCode === 308
          ) {
            const location = res.headers.location
            if (!location) {
              reject(new Error('重定向目标为空'))
              return
            }
            res.resume()
            doDownload(location, redirectCount + 1)
            return
          }

          if (res.statusCode !== 200) {
            reject(new Error(`下载失败，HTTP ${res.statusCode ?? '未知'}`))
            return
          }

          const total = parseInt(res.headers['content-length'] ?? '0', 10)
          let downloaded = 0

          const fileStream = fs.createWriteStream(tmpPath)

          res.on('data', (chunk: Buffer) => {
            downloaded += chunk.length
            onProgress({
              downloaded,
              total,
              percent: total > 0 ? Math.round((downloaded / total) * 100) : 0,
            })
          })

          res.pipe(fileStream)

          fileStream.on('finish', () => {
            try {
              fs.renameSync(tmpPath, getModelPath())
              activeDownloadAbort = null
              resolve()
            } catch (e) {
              reject(e)
            }
          })

          fileStream.on('error', (e) => {
            try { fs.unlinkSync(tmpPath) } catch { /* ignore */ }
            reject(e)
          })

          res.on('error', (e) => {
            try { fs.unlinkSync(tmpPath) } catch { /* ignore */ }
            reject(e)
          })
        },
      )

      req.on('error', (e) => {
        try { fs.unlinkSync(tmpPath) } catch { /* ignore */ }
        reject(e)
      })

      activeDownloadAbort = () => {
        req.destroy(new Error('用户取消'))
        try { fs.unlinkSync(tmpPath) } catch { /* ignore */ }
      }
    }

    doDownload(MODEL_URL)
  })
}

export function cancelDownload(): void {
  if (activeDownloadAbort) {
    activeDownloadAbort()
    activeDownloadAbort = null
  }
}

export function deleteModel(): void {
  try { fs.unlinkSync(getModelPath()) } catch { /* ignore */ }
  // Release loaded model so next call reloads
  loadedModel = null
  llamaInstance = null
}

// ───────── Inference ─────────

export type WordInput = {
  word: string
  start: number
  end: number
  confidence: number
}

export const DEFAULT_LOCAL_FILLER_PROMPT = `你是一个视频剪辑助手，帮助口播视频创作者去除废话。

请分析以下编号词语列表（来自中文口播视频转录），找出所有废话词：
- 语气词：嗯、啊、哦、呢、吧、哈、哎、唉
- 填充词：那个、然后、就是、就是说、对对对、这个
- 无意义重复：同一语义连续重复出现

请只返回 JSON 格式，不要有任何其他内容：{"indices": [废话词的序号列表]}`

export async function detectFillersLocal(
  words: WordInput[],
  systemPrompt?: string,
): Promise<number[]> {
  // Lazy-load model (node-llama-cpp is ESM-only, use dynamic import)
  if (!llamaInstance || !loadedModel) {
    const { getLlama } = await import('node-llama-cpp')
    llamaInstance = await getLlama()
    loadedModel = await llamaInstance.loadModel({ modelPath: getModelPath() })
  }

  const { LlamaChatSession, LlamaJsonSchemaGrammar } = await import('node-llama-cpp')

  // Force JSON output with schema grammar
  const grammar = new LlamaJsonSchemaGrammar(llamaInstance, {
    type: 'object',
    properties: {
      indices: {
        type: 'array',
        items: { type: 'integer', minimum: 0 },
      },
    },
    required: ['indices'],
  } as Parameters<typeof LlamaJsonSchemaGrammar>[1])

  const context = await loadedModel.createContext({ contextSize: 4096 })
  const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt: systemPrompt?.trim() || DEFAULT_LOCAL_FILLER_PROMPT,
  })

  const wordList = words.map((w, i) => `${i}. ${w.word}`).join('\n')
  console.log('[local-llm] 开始推理, 词数=', words.length, 'contextSize=4096')
  const response = await session.prompt(`词语列表：\n${wordList}`, {
    grammar,
    maxTokens: 2048,
    temperature: 0.1,
  })

  console.log('[local-llm] 原始响应=', JSON.stringify(response))

  if (!response?.trim()) {
    console.warn('[local-llm] 模型输出为空，返回空结果')
    return []
  }

  // Qwen3 may wrap output in <think>...</think>, extract JSON part
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  const jsonStr = jsonMatch ? jsonMatch[0] : response.trim()
  console.log('[local-llm] 解析 JSON=', jsonStr.slice(0, 200))

  const parsed = JSON.parse(jsonStr) as { indices?: unknown }
  if (!Array.isArray(parsed.indices)) return []

  return parsed.indices.filter(
    (i): i is number => typeof i === 'number' && i >= 0 && i < words.length,
  )
}
