// AI Settings page - Provider management, API key config, model selection
// Reference design: openclaw-cn Settings.tsx (simplified for ClearCut-AI)

import { useEffect, useState } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import type { ProviderConfig, ProviderStatus, ProviderAuth } from '../../types/provider'

// --- Provider Card Component ---

interface ProviderCardProps {
  provider: ProviderConfig
  status: ProviderStatus | undefined
  isActive: boolean
  onSave: (auth: ProviderAuth) => Promise<void>
  onDelete: (providerId: string) => Promise<void>
  onTest: (providerId: string, apiKey?: string, baseUrl?: string) => Promise<{ ok: boolean; error?: string }>
  onSetActive: (providerId: string, model: string) => Promise<void>
  onSetDefaultModel: (providerId: string, modelId: string) => Promise<void>
}

function ProviderCard({
  provider,
  status,
  isActive,
  onSave,
  onDelete,
  onTest,
  onSetActive,
  onSetDefaultModel,
}: ProviderCardProps) {
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
    <div className={`provider-card ${isActive ? 'active' : ''} ${configured ? 'configured' : ''}`}>
      <div className="provider-header">
        <div className="provider-info">
          <span className={`provider-icon icon-${provider.icon || provider.id}`} />
          <div>
            <h3>{provider.name}</h3>
            {configured && status?.maskedKey && (
              <span className="masked-key">{status.maskedKey}</span>
            )}
          </div>
        </div>
        <div className="provider-actions">
          {configured && !isActive && (
            <button className="btn-activate" onClick={handleActivate}>
              设为活跃
            </button>
          )}
          {isActive && <span className="badge-active">当前使用</span>}
        </div>
      </div>

      {/* Model selector */}
      {provider.models.length > 1 && (
        <div className="model-selector">
          <label>模型</label>
          <select value={selectedModel} onChange={(e) => handleModelChange(e.target.value)}>
            {provider.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Edit / Configure area */}
      {editing || !configured ? (
        <div className="provider-edit">
          {provider.id === 'custom' && (
            <div className="field">
              <label>API Base URL</label>
              <input
                type="text"
                placeholder="https://your-api.com/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
          )}
          <div className="field">
            <label>API Key {provider.envVar && <span className="env-hint">({provider.envVar})</span>}</label>
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

          {testResult && (
            <div className={`test-result ${testResult.ok ? 'success' : 'error'}`}>
              {testResult.ok ? '✓ 连接成功' : `✗ ${testResult.error || '连接失败'}`}
            </div>
          )}

          <div className="edit-actions">
            <button className="btn-test" onClick={handleTest} disabled={testing}>
              {testing ? '测试中...' : '测试连接'}
            </button>
            <button className="btn-save" onClick={handleSave} disabled={saving || !apiKey.trim()}>
              {saving ? '保存中...' : '保存'}
            </button>
            {configured && (
              <button className="btn-cancel" onClick={() => { setEditing(false); setApiKey(''); setTestResult(null) }}>
                取消
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="provider-configured">
          <div className="configured-actions">
            <button className="btn-edit" onClick={() => setEditing(true)}>
              修改密钥
            </button>
            <button className="btn-test" onClick={handleTest} disabled={testing}>
              {testing ? '测试中...' : '测试连接'}
            </button>
            <button className="btn-delete" onClick={handleDelete}>
              移除
            </button>
          </div>
          {testResult && (
            <div className={`test-result ${testResult.ok ? 'success' : 'error'}`}>
              {testResult.ok ? '✓ 连接成功' : `✗ ${testResult.error || '连接失败'}`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Main AISettings Page ---

export default function AISettings() {
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

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const handleSave = async (auth: ProviderAuth) => {
    await saveAuth(auth)
  }

  const handleDelete = async (providerId: string) => {
    await deleteAuth(providerId)
  }

  const handleSetActive = async (providerId: string, model: string) => {
    await setActive(providerId, model)
  }

  const handleSetDefaultModel = async (providerId: string, modelId: string) => {
    await setDefaultModel(providerId, modelId)
  }

  if (loading) {
    return <div className="settings-loading">加载中...</div>
  }

  // Separate configured and unconfigured providers
  const configuredProviders = providers.filter((p) =>
    statuses.find((s) => s.providerId === p.id && s.configured),
  )
  const unconfiguredProviders = providers.filter(
    (p) => !statuses.find((s) => s.providerId === p.id && s.configured),
  )

  return (
    <div className="ai-settings">
      <div className="settings-header">
        <h2>AI 模型设置</h2>
        <p className="settings-desc">配置 LLM 提供商的 API 密钥，用于智能剪辑和 AI 分析功能</p>
      </div>

      {/* Active provider summary */}
      {activeProvider && (
        <div className="active-summary">
          <span className="active-label">当前活跃：</span>
          <span className="active-value">
            {providers.find((p) => p.id === activeProvider.providerId)?.name} / {activeProvider.model}
          </span>
        </div>
      )}

      {/* Configured providers */}
      {configuredProviders.length > 0 && (
        <section className="provider-section">
          <h3 className="section-title">已配置</h3>
          {configuredProviders.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              status={statuses.find((s) => s.providerId === p.id)}
              isActive={activeProvider?.providerId === p.id}
              onSave={handleSave}
              onDelete={handleDelete}
              onTest={testProvider}
              onSetActive={handleSetActive}
              onSetDefaultModel={handleSetDefaultModel}
            />
          ))}
        </section>
      )}

      {/* Unconfigured providers */}
      {unconfiguredProviders.length > 0 && (
        <section className="provider-section">
          <h3 className="section-title">添加提供商</h3>
          {unconfiguredProviders.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              status={statuses.find((s) => s.providerId === p.id)}
              isActive={false}
              onSave={handleSave}
              onDelete={handleDelete}
              onTest={testProvider}
              onSetActive={handleSetActive}
              onSetDefaultModel={handleSetDefaultModel}
            />
          ))}
        </section>
      )}
    </div>
  )
}
