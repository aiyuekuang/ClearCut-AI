// AI Engine Settings - unified AI configuration page
// Global mode toggle (local vs API) + per-capability slot status

import { useEffect, useState, useCallback } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { ExternalLink, KeyRound, LogIn, Globe, Copy, Check, Loader2 } from 'lucide-react'
import { AI_SLOTS } from '@/config/ai-slots.config'
import { SLOT_METHOD_LABELS } from '@/types/ai-config'
import type { AIMode, SlotMethod, AISlotDef } from '@/types/ai-config'
import type { ProviderConfig, ProviderStatus, ProviderAuth, OAuthStatusEvent } from '@/types/provider'
import { LocalModelSection } from './LocalModelSection'

// ─── OAuth Flow State ────────────────────────────────────────

type OAuthFlowState = {
  status: 'idle' | 'device_code' | 'polling' | 'success' | 'error'
  userCode?: string
  verificationUri?: string
  error?: string
}

// ─── OAuth Provider Card ─────────────────────────────────────

function OAuthProviderCard({
  provider,
  status,
  flow,
  isActive,
  onStartOAuth,
  onCancelOAuth,
  onDelete,
  onSetActive,
  onSetDefaultModel,
}: {
  provider: ProviderConfig
  status: ProviderStatus | undefined
  flow: OAuthFlowState
  isActive: boolean
  onStartOAuth: (providerId: string) => void
  onCancelOAuth: (providerId: string) => void
  onDelete: (providerId: string) => Promise<unknown>
  onSetActive: (providerId: string, model: string) => Promise<unknown>
  onSetDefaultModel: (providerId: string, modelId: string) => Promise<unknown>
}) {
  const [copied, setCopied] = useState(false)
  const configured = status?.configured || false
  const selectedModel = status?.defaultModel || provider.models[0]?.id
  const isFlowActive = flow.status !== 'idle' && flow.status !== 'success'

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleModelChange = async (modelId: string) => {
    await onSetDefaultModel(provider.id, modelId)
    if (isActive) await onSetActive(provider.id, modelId)
  }

  const handleActivate = async () => {
    if (configured && selectedModel) await onSetActive(provider.id, selectedModel)
  }

  return (
    <div className={`rounded-lg border p-4 ${isActive ? 'border-brand bg-brand/5' : 'border-border bg-surface-2'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-brand" />
          <span className="text-sm font-semibold text-text">{provider.name}</span>
          {configured && (
            <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
              已登录
            </span>
          )}
          {flow.status === 'success' && (
            <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
              登录成功
            </span>
          )}
          {isActive && (
            <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand">
              当前使用
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {configured && !isActive && (
            <button
              className="rounded-md bg-brand/10 px-3 py-1 text-xs font-medium text-brand hover:bg-brand/20"
              onClick={handleActivate}
            >
              设为活跃
            </button>
          )}
          {configured && !isFlowActive && (
            <button onClick={() => onDelete(provider.id)} className="rounded-md border border-border px-3 py-1 text-xs text-danger hover:bg-danger/10">
              退出登录
            </button>
          )}
          {!configured && !isFlowActive && (
            <button
              onClick={() => onStartOAuth(provider.id)}
              className="rounded-md bg-brand px-4 py-1.5 text-xs font-medium text-white hover:bg-brand/90"
            >
              浏览器登录
            </button>
          )}
          {isFlowActive && (
            <button onClick={() => onCancelOAuth(provider.id)} className="rounded-md border border-border px-3 py-1 text-xs hover:bg-surface-3">
              取消
            </button>
          )}
        </div>
      </div>

      {/* Device Code UI */}
      {(flow.status === 'device_code' || flow.status === 'polling') && flow.userCode && (
        <div className="mb-3 rounded-lg border border-brand/30 bg-brand/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-brand">
            <Loader2 className="h-3 w-3 animate-spin" />
            浏览器已打开，请在页面中输入以下验证码：
          </div>
          <div className="flex items-center gap-2">
            <code className="rounded-md bg-surface-1 px-4 py-2 font-mono text-base font-bold tracking-[0.3em] text-text">
              {flow.userCode}
            </code>
            <button
              onClick={() => handleCopyCode(flow.userCode!)}
              className="rounded-md border border-border p-1.5 text-text-muted hover:bg-surface-3"
              title="复制验证码"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          {flow.verificationUri && (
            <p className="text-xs text-text-muted">
              如果浏览器未自动打开，请手动访问：
              <button
                onClick={() => window.api.app.openExternal(flow.verificationUri!)}
                className="ml-1 text-brand hover:underline"
              >
                {flow.verificationUri}
              </button>
            </p>
          )}
        </div>
      )}

      {/* Polling without code (connecting) */}
      {flow.status === 'polling' && !flow.userCode && (
        <div className="mb-3 flex items-center gap-2 text-xs text-text-muted">
          <Loader2 className="h-3 w-3 animate-spin text-brand" />
          正在连接...
        </div>
      )}

      {/* Error */}
      {flow.status === 'error' && (
        <div className="mb-3 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          登录失败: {flow.error}
        </div>
      )}

      {/* Configured: model selector */}
      {configured && provider.models.length > 1 && (
        <div>
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-1 px-2.5 py-1.5 text-xs text-text"
          >
            {provider.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}{m.description ? ` — ${m.description}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

// ─── Slot Status Row ────────────────────────────────────────

function SlotStatusIcon({ method }: { method: SlotMethod }) {
  if (method === 'disabled') {
    return <span className="text-text-muted" title="已禁用">—</span>
  }
  if (method === 'rules' || method === 'dictionary') {
    return <span title="降级可用（非 AI）">⚡</span>
  }
  return <span className="text-green-500" title="AI 可用">✓</span>
}

function SlotRow({
  slot,
  method,
  mode,
  onMethodChange,
}: {
  slot: AISlotDef
  method: SlotMethod
  mode: AIMode
  onMethodChange: (slotId: string, method: SlotMethod) => void
}) {
  // Filter methods to show only those valid for current mode
  const availableMethods = slot.methods.filter((m) => {
    if (mode === 'local' && m === 'api-llm') return false
    if (mode === 'api' && m === 'local-llm') return false
    return true
  })

  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-surface-2 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <SlotStatusIcon method={method} />
        <div className="min-w-0">
          <span className="text-sm font-medium text-text">{slot.name}</span>
          <p className="text-xs text-text-muted truncate">{slot.description}</p>
        </div>
      </div>
      <select
        value={method}
        onChange={(e) => onMethodChange(slot.id, e.target.value as SlotMethod)}
        className="ml-3 shrink-0 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-text focus:border-brand focus:outline-none"
      >
        {availableMethods.map((m) => (
          <option key={m} value={m}>
            {SLOT_METHOD_LABELS[m]}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── Provider Card (inlined, simplified from AISettings) ────

function ProviderCard({
  provider,
  status,
  isActive,
  onSave,
  onDelete,
  onTest,
  onSetActive,
  onSetDefaultModel,
}: {
  provider: ProviderConfig
  status: ProviderStatus | undefined
  isActive: boolean
  onSave: (auth: ProviderAuth) => Promise<unknown>
  onDelete: (providerId: string) => Promise<unknown>
  onTest: (providerId: string, apiKey?: string, baseUrl?: string) => Promise<{ ok: boolean; error?: string }>
  onSetActive: (providerId: string, model: string) => Promise<unknown>
  onSetDefaultModel: (providerId: string, modelId: string) => Promise<unknown>
}) {
  const [editing, setEditing] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState(provider.baseUrl || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const configured = status?.configured || false
  const selectedModel = status?.defaultModel || provider.models[0]?.id

  const handleSave = async () => {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      await onSave({
        providerId: provider.id,
        mode: 'api_key',
        apiKey: apiKey.trim(),
        baseUrl: provider.id === 'custom' ? baseUrl.trim() : undefined,
      })
      setApiKey('')
      setEditing(false)
      setTestResult(null)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const key = apiKey.trim() || undefined
      const url = provider.id === 'custom' ? baseUrl.trim() || undefined : undefined
      const result = await onTest(provider.id, key, url)
      setTestResult(result)
    } catch {
      setTestResult({ ok: false, error: '测试请求失败' })
    } finally {
      setTesting(false)
    }
  }

  const handleDelete = async () => {
    await onDelete(provider.id)
    setTestResult(null)
  }

  const handleModelChange = async (modelId: string) => {
    await onSetDefaultModel(provider.id, modelId)
    if (isActive) {
      await onSetActive(provider.id, modelId)
    }
  }

  const handleActivate = async () => {
    if (configured && selectedModel) {
      await onSetActive(provider.id, selectedModel)
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${isActive ? 'border-brand bg-brand/5' : 'border-border bg-surface-2'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text">{provider.name}</span>
          {configured && status?.maskedKey && (
            <span className="text-xs text-text-muted">{status.maskedKey}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {configured && !isActive && (
            <button
              className="rounded-md bg-brand/10 px-3 py-1 text-xs font-medium text-brand hover:bg-brand/20"
              onClick={handleActivate}
            >
              设为活跃
            </button>
          )}
          {isActive && (
            <span className="rounded-md bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand">
              当前使用
            </span>
          )}
        </div>
      </div>

      {/* Model selector */}
      {configured && provider.models.length > 1 && (
        <div className="mb-3">
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-1 px-2.5 py-1.5 text-xs text-text"
          >
            {provider.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}{m.description ? ` — ${m.description}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quick links */}
      {(provider.apiKeyUrl || provider.loginUrl) && (
        <div className="mb-3 flex items-center gap-3">
          {provider.apiKeyUrl && (
            <button
              onClick={() => window.api.app.openExternal(provider.apiKeyUrl!)}
              className="inline-flex items-center gap-1.5 text-xs text-brand hover:text-brand/80 hover:underline"
            >
              <KeyRound className="h-3 w-3" />
              获取 API Key
              <ExternalLink className="h-2.5 w-2.5" />
            </button>
          )}
          {provider.loginUrl && (
            <button
              onClick={() => window.api.app.openExternal(provider.loginUrl!)}
              className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text hover:underline"
            >
              <LogIn className="h-3 w-3" />
              登录控制台
              <ExternalLink className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      )}

      {/* Edit / Configure */}
      {editing || !configured ? (
        <div className="space-y-2">
          {provider.id === 'custom' && (
            <input
              type="text"
              placeholder="API Base URL"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-1 px-3 py-1.5 text-xs"
            />
          )}
          <input
            type="password"
            placeholder="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full rounded-md border border-border bg-surface-1 px-3 py-1.5 text-xs"
          />
          {testResult && (
            <div className={`text-xs px-2 py-1 rounded ${testResult.ok ? 'text-green-600 bg-green-500/10' : 'text-danger bg-danger/10'}`}>
              {testResult.ok ? '✓ 连接成功' : `✗ ${testResult.error || '连接失败'}`}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={testing}
              className="rounded-md border border-border px-3 py-1 text-xs hover:bg-surface-3"
            >
              {testing ? '测试中...' : '测试'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !apiKey.trim()}
              className="rounded-md bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand/90 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            {configured && (
              <button
                onClick={() => { setEditing(false); setApiKey(''); setTestResult(null) }}
                className="rounded-md border border-border px-3 py-1 text-xs hover:bg-surface-3"
              >
                取消
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="rounded-md border border-border px-3 py-1 text-xs hover:bg-surface-3">
            修改密钥
          </button>
          <button onClick={handleTest} disabled={testing} className="rounded-md border border-border px-3 py-1 text-xs hover:bg-surface-3">
            {testing ? '测试中...' : '测试'}
          </button>
          <button onClick={handleDelete} className="rounded-md border border-border px-3 py-1 text-xs text-danger hover:bg-danger/10">
            移除
          </button>
          {testResult && (
            <span className={`text-xs self-center ${testResult.ok ? 'text-green-600' : 'text-danger'}`}>
              {testResult.ok ? '✓ 成功' : `✗ ${testResult.error || '失败'}`}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main AIEngineSettings Page ─────────────────────────────

export default function AIEngineSettings() {
  const {
    providers,
    statuses,
    activeProvider,
    loading,
    refreshAll,
    saveAuth,
    deleteAuth,
    testProvider,
    setActive,
    setDefaultModel,
  } = useSettingsStore()

  const [aiMode, setAiMode] = useState<AIMode>('local')
  const [slotMethods, setSlotMethods] = useState<Record<string, SlotMethod>>({})
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [oauthFlows, setOauthFlows] = useState<Record<string, OAuthFlowState>>({})

  // Load current AI settings
  const loadAISettings = useCallback(async () => {
    const all = await window.api.settings.getAll() as Record<string, unknown>
    setAiMode((all['ai.mode'] as AIMode) || 'local')
    const methods: Record<string, SlotMethod> = {}
    for (const slot of AI_SLOTS) {
      methods[slot.id] = (all[`ai.slots.${slot.id}`] as SlotMethod) || slot.localDefault
    }
    setSlotMethods(methods)
    setSettingsLoaded(true)
  }, [])

  useEffect(() => {
    refreshAll()
    loadAISettings()
  }, [refreshAll, loadAISettings])

  // 监听 OAuth 状态推送
  useEffect(() => {
    const unsub = window.api.oauth.onStatus((event: OAuthStatusEvent) => {
      setOauthFlows((prev) => {
        const existing = prev[event.providerId]
        return {
          ...prev,
          [event.providerId]: {
            status: event.status,
            userCode: event.status === 'device_code' ? event.info?.userCode : existing?.userCode,
            verificationUri: event.status === 'device_code' ? event.info?.verificationUri : existing?.verificationUri,
            error: event.status === 'error' ? event.error : undefined,
          },
        }
      })
      if (event.status === 'success') {
        refreshAll()
        setTimeout(() => {
          setOauthFlows((prev) => ({ ...prev, [event.providerId]: { status: 'idle' } }))
        }, 3000)
      }
    })
    return unsub
  }, [refreshAll])

  const handleStartOAuth = (providerId: string) => {
    setOauthFlows((prev) => ({ ...prev, [providerId]: { status: 'polling' } }))
    window.api.oauth.start(providerId)
  }

  const handleCancelOAuth = async (providerId: string) => {
    await window.api.oauth.cancel(providerId)
    setOauthFlows((prev) => ({ ...prev, [providerId]: { status: 'idle' } }))
  }

  const getOAuthFlow = (providerId: string): OAuthFlowState =>
    oauthFlows[providerId] || { status: 'idle' }

  // Switch global mode — batch update all slots
  const handleModeSwitch = async (mode: AIMode) => {
    const entries: Record<string, string> = { 'ai.mode': mode }
    const newMethods: Record<string, SlotMethod> = {}
    for (const slot of AI_SLOTS) {
      const method = mode === 'local' ? slot.localDefault : slot.apiDefault
      entries[`ai.slots.${slot.id}`] = method
      newMethods[slot.id] = method
    }
    await window.api.settings.setMany(entries)
    setAiMode(mode)
    setSlotMethods(newMethods)
  }

  // Change a single slot method
  const handleSlotMethodChange = async (slotId: string, method: SlotMethod) => {
    await window.api.settings.set(`ai.slots.${slotId}`, method)
    setSlotMethods((prev) => ({ ...prev, [slotId]: method }))
  }

  if (loading || !settingsLoaded) {
    return <div className="text-sm text-text-muted">加载中...</div>
  }

  const oauthProviders = providers.filter((p) => p.authModes.includes('oauth'))
  const apiKeyProviders = providers.filter((p) => !p.authModes.includes('oauth'))
  const configuredProviders = apiKeyProviders.filter((p) =>
    statuses.find((s) => s.providerId === p.id && s.configured),
  )
  const unconfiguredProviders = apiKeyProviders.filter(
    (p) => !statuses.find((s) => s.providerId === p.id && s.configured),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-text">AI 引擎</h2>
        <p className="mt-1 text-xs text-text-muted">
          配置 AI 运行模式和各能力使用的模型。语音识别始终在本地运行。
        </p>
      </div>

      {/* ── Global Mode Toggle ── */}
      <div className="rounded-lg border border-border bg-surface-1 p-4">
        <h3 className="mb-3 text-sm font-semibold text-text">LLM 运行模式</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Local mode */}
          <button
            onClick={() => handleModeSwitch('local')}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              aiMode === 'local'
                ? 'border-brand bg-brand/5'
                : 'border-border bg-surface-2 hover:border-text-muted'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-3 w-3 rounded-full border-2 ${
                aiMode === 'local' ? 'border-brand bg-brand' : 'border-text-muted'
              }`} />
              <span className="text-sm font-semibold text-text">本地模型</span>
              <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                推荐
              </span>
            </div>
            <p className="text-xs text-text-muted ml-5">
              完全离线，无需 API Key，隐私安全
            </p>
          </button>

          {/* API mode */}
          <button
            onClick={() => handleModeSwitch('api')}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              aiMode === 'api'
                ? 'border-brand bg-brand/5'
                : 'border-border bg-surface-2 hover:border-text-muted'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-3 w-3 rounded-full border-2 ${
                aiMode === 'api' ? 'border-brand bg-brand' : 'border-text-muted'
              }`} />
              <span className="text-sm font-semibold text-text">API 提供商</span>
            </div>
            <p className="text-xs text-text-muted ml-5">
              效果更好，解锁全部 AI 能力，需要 API Key
            </p>
          </button>
        </div>
      </div>

      {/* ── Mode-specific Panel ── */}
      {aiMode === 'local' ? (
        <div className="rounded-lg border border-border bg-surface-1 p-4">
          <h3 className="mb-3 text-sm font-semibold text-text">本地模型管理</h3>
          <LocalModelSection />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface-1 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">API 提供商配置</h3>
            {activeProvider && (
              <span className="text-xs text-text-muted">
                当前：{providers.find((p) => p.id === activeProvider.providerId)?.name} / {activeProvider.model}
              </span>
            )}
          </div>

          {/* OAuth 浏览器登录提供商 */}
          {oauthProviders.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-brand" />
                <span className="text-xs font-medium text-text">浏览器登录</span>
                <span className="text-xs text-text-muted">— 免费使用，无需 API Key</span>
              </div>
              {oauthProviders.map((p) => (
                <OAuthProviderCard
                  key={p.id}
                  provider={p}
                  status={statuses.find((s) => s.providerId === p.id)}
                  flow={getOAuthFlow(p.id)}
                  isActive={activeProvider?.providerId === p.id}
                  onStartOAuth={handleStartOAuth}
                  onCancelOAuth={handleCancelOAuth}
                  onDelete={deleteAuth}
                  onSetActive={setActive}
                  onSetDefaultModel={setDefaultModel}
                />
              ))}
            </div>
          )}

          {/* Configured API key providers */}
          {configuredProviders.length > 0 && (
            <div className="space-y-2">
              {configuredProviders.map((p) => (
                <ProviderCard
                  key={p.id}
                  provider={p}
                  status={statuses.find((s) => s.providerId === p.id)}
                  isActive={activeProvider?.providerId === p.id}
                  onSave={saveAuth}
                  onDelete={deleteAuth}
                  onTest={testProvider}
                  onSetActive={setActive}
                  onSetDefaultModel={setDefaultModel}
                />
              ))}
            </div>
          )}

          {/* Add provider */}
          {unconfiguredProviders.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-text-secondary hover:text-text">
                添加提供商 ({unconfiguredProviders.length} 个可用)
              </summary>
              <div className="mt-2 space-y-2">
                {unconfiguredProviders.map((p) => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    status={statuses.find((s) => s.providerId === p.id)}
                    isActive={false}
                    onSave={saveAuth}
                    onDelete={deleteAuth}
                    onTest={testProvider}
                    onSetActive={setActive}
                    onSetDefaultModel={setDefaultModel}
                  />
                ))}
              </div>
            </details>
          )}

          {/* No provider configured warning */}
          {configuredProviders.length === 0 && oauthProviders.every(p => !statuses.find(s => s.providerId === p.id && s.configured)) && (
            <div className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
              尚未配置任何 API 提供商，可使用上方浏览器登录或展开下方列表添加 API Key
            </div>
          )}
        </div>
      )}

      {/* ── Capability Slots Panel ── */}
      <div className="rounded-lg border border-border bg-surface-1 p-4">
        <h3 className="mb-1 text-sm font-semibold text-text">AI 能力配置</h3>
        <p className="mb-3 text-xs text-text-muted">
          各项 AI 能力当前使用的模型/方法，切换运行模式时自动调整
        </p>
        <div className="divide-y divide-border/50">
          {AI_SLOTS.map((slot) => (
            <SlotRow
              key={slot.id}
              slot={slot}
              method={slotMethods[slot.id] || slot.localDefault}
              mode={aiMode}
              onMethodChange={handleSlotMethodChange}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
