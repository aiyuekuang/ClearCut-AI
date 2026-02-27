// LLM Provider type definitions for ClearCut-AI

export type AuthMode = 'api_key' | 'oauth'

export interface ProviderConfig {
  id: string
  name: string
  baseUrl: string
  models: ModelInfo[]
  authModes: AuthMode[]
  /** Environment variable name for API key */
  envVar?: string
  /** SDK type to use for API calls */
  sdkType: 'anthropic' | 'openai-compatible'
  /** Provider icon identifier */
  icon?: string
  /** URL to purchase / manage API keys */
  apiKeyUrl?: string
  /** URL for web-based login / OAuth flow */
  loginUrl?: string
}

export interface ModelInfo {
  id: string
  name: string
  description?: string
}

export interface ProviderAuth {
  providerId: string
  mode: AuthMode
  apiKey?: string
  baseUrl?: string
  /** OAuth tokens */
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
}

/** OAuth 状态事件（主进程 → 渲染进程推送） */
export type OAuthStatus =
  | { status: 'device_code'; info: { userCode: string; verificationUri: string; expiresIn: number } }
  | { status: 'polling' }
  | { status: 'success' }
  | { status: 'error'; error: string }

export type OAuthStatusEvent = { providerId: string } & OAuthStatus

export interface ProviderStatus {
  providerId: string
  configured: boolean
  authMode?: AuthMode
  maskedKey?: string
  baseUrl?: string
  defaultModel?: string
}

// --- LLM Chat ---

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatOptions {
  model: string
  providerId: string
  maxTokens?: number
  temperature?: number
}

export interface ChatResponse {
  content: string
  model: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

// --- IPC API ---

export interface ProviderAPI {
  list(): Promise<ProviderConfig[]>
  statuses(): Promise<ProviderStatus[]>
  saveAuth(auth: ProviderAuth): Promise<{ ok: boolean }>
  deleteAuth(providerId: string): Promise<{ ok: boolean }>
  test(providerId: string, apiKey?: string, baseUrl?: string): Promise<{ ok: boolean; error?: string }>
  setDefaultModel(providerId: string, modelId: string): Promise<{ ok: boolean }>
  setActive(providerId: string, model: string): Promise<{ ok: boolean }>
  getActive(): Promise<{ providerId: string; model: string } | null>
}

export interface OAuthAPI {
  start(providerId: string): Promise<void>
  cancel(providerId: string): Promise<void>
  onStatus(callback: (event: OAuthStatusEvent) => void): () => void
}
