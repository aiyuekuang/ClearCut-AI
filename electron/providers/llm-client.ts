// Unified LLM client - supports Anthropic and OpenAI-compatible APIs
// Used for AI analysis features in ClearCut-AI

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
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

function createOpenAICompatibleClient(config: LLMClientConfig): LLMClient {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  })

  return {
    async chat(messages, options) {
      const response = await client.chat.completions.create({
        model: options?.model || config.model,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      })

      const choice = response.choices[0]
      return {
        content: choice?.message?.content || '',
        model: response.model,
        usage: response.usage
          ? {
              inputTokens: response.usage.prompt_tokens,
              outputTokens: response.usage.completion_tokens || 0,
            }
          : undefined,
      }
    },

    async testConnection() {
      await client.chat.completions.create({
        model: config.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }],
      })
    },
  }
}

export function createLLMClient(config: LLMClientConfig): LLMClient {
  if (config.sdkType === 'anthropic') {
    return createAnthropicClient(config)
  }
  return createOpenAICompatibleClient(config)
}
