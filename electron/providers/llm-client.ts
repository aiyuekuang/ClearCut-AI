// Unified LLM client - supports Anthropic and OpenAI-compatible APIs
// Used for AI analysis features in ClearCut-AI

import Anthropic from '@anthropic-ai/sdk'
import { sidecarRequest } from '../sidecar'
import type { ChatMessage, ChatOptions, ChatResponse } from '../../src/types/provider'

interface LLMClientConfig {
  sdkType: 'anthropic' | 'openai-compatible'
  apiKey: string
  baseUrl: string
  model: string
}

interface LLMClient {
  chat(messages: ChatMessage[], options?: Partial<ChatOptions>): Promise<ChatResponse>
  testConnection(): Promise<void>
}

function createAnthropicClient(config: LLMClientConfig): LLMClient {
  const client = new Anthropic({ apiKey: config.apiKey })

  return {
    async chat(messages, options) {
      const systemMsg = messages.find((m) => m.role === 'system')
      const chatMsgs = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      const response = await client.messages.create({
        model: options?.model || config.model,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature,
        system: systemMsg?.content,
        messages: chatMsgs,
      })

      const textBlock = response.content.find((b) => b.type === 'text')
      return {
        content: textBlock?.text || '',
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      }
    },

    async testConnection() {
      await client.messages.create({
        model: config.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }],
      })
    },
  }
}

// OpenAI-compatible 通过 Python sidecar 代理请求
// Electron 主进程无法直接发起外部 HTTPS 请求（ERR_NETWORK_IO_SUSPENDED），
// 转由本地 sidecar（Python）代理，sidecar 无此限制。
async function openaiCompatChat(
  config: LLMClientConfig,
  messages: ChatMessage[],
  options?: Partial<ChatOptions>,
): Promise<ChatResponse> {
  const model = options?.model || config.model
  console.log('[LLM:openai-compat] via sidecar proxy, model=', model, 'baseUrl=', config.baseUrl)

  const result = await sidecarRequest<{
    content: string
    model: string
    input_tokens?: number
    output_tokens?: number
  }>('POST', '/llm/chat', {
    base_url: config.baseUrl,
    api_key: config.apiKey,
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: options?.maxTokens || 4096,
    temperature: options?.temperature ?? 0.7,
  })

  console.log('[LLM:openai-compat] sidecar 响应 model=', result.model, 'length=', result.content.length)
  return {
    content: result.content,
    model: result.model,
    usage: result.input_tokens !== undefined
      ? { inputTokens: result.input_tokens, outputTokens: result.output_tokens ?? 0 }
      : undefined,
  }
}

function createOpenAICompatibleClient(config: LLMClientConfig): LLMClient {
  return {
    async chat(messages, options) {
      return openaiCompatChat(config, messages, options)
    },
    async testConnection() {
      await openaiCompatChat(config, [{ role: 'user', content: 'hi' }], { maxTokens: 10 })
    },
  }
}

export function createLLMClient(config: LLMClientConfig): LLMClient {
  if (config.sdkType === 'anthropic') {
    return createAnthropicClient(config)
  }
  return createOpenAICompatibleClient(config)
}
