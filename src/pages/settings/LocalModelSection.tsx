// LocalModelSection - UI for managing the built-in Qwen2.5-0.5B model
// Shows download status, progress bar, and delete option

import { useEffect, useRef, useState } from 'react'

type ModelStatus = {
  downloaded: boolean
  info: {
    name: string
    quantization: string
    sizeMB: number
    description: string
    filename: string
  }
}

type DownloadProgress = {
  downloaded: number
  total: number
  percent: number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const gb = bytes / 1_073_741_824
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  const mb = bytes / 1_048_576
  return `${mb.toFixed(0)} MB`
}

export function LocalModelSection() {
  const [status, setStatus] = useState<ModelStatus | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const unsubRef = useRef<(() => void) | null>(null)

  const loadStatus = async () => {
    const s = await window.api.llm.modelStatus()
    setStatus(s as ModelStatus)
  }

  useEffect(() => {
    loadStatus()
    return () => {
      unsubRef.current?.()
    }
  }, [])

  const handleDownload = async () => {
    setDownloading(true)
    setProgress({ downloaded: 0, total: 0, percent: 0 })
    setError(null)

    // Subscribe to progress events
    unsubRef.current = window.api.llm.onDownloadProgress((p) => {
      setProgress(p)
    })

    const res = await window.api.llm.downloadModel()
    unsubRef.current?.()
    unsubRef.current = null
    setDownloading(false)

    if (res.ok) {
      setProgress(null)
      await loadStatus()
    } else {
      setError((res as { ok: false; error: string }).error || '下载失败')
      setProgress(null)
    }
  }

  const handleCancel = async () => {
    await window.api.llm.cancelDownload()
    setDownloading(false)
    setProgress(null)
  }

  const handleDelete = async () => {
    if (!confirm('确认删除本地模型文件？删除后需重新下载。')) return
    setDeleting(true)
    await window.api.llm.deleteModel()
    await loadStatus()
    setDeleting(false)
  }

  if (!status) {
    return <div className="text-sm text-text-muted">检测中...</div>
  }

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text">{status.info.name}</span>
            <span className="rounded bg-surface-3 px-1.5 py-0.5 text-xs text-text-muted">
              {status.info.quantization}
            </span>
            {status.downloaded && (
              <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-xs font-medium text-green-500">
                已下载
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-text-muted">{status.info.description}</p>
        </div>
        <span className="shrink-0 text-xs text-text-muted">{status.info.sizeMB} MB</span>
      </div>

      {/* Download progress */}
      {downloading && progress && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-text-secondary">
            <span>下载中...</span>
            <span>
              {formatBytes(progress.downloaded)}{progress.total > 0 ? ` / ${formatBytes(progress.total)}` : ''}{' '}
              ({progress.percent}%)
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!status.downloaded && !downloading && (
          <button
            onClick={handleDownload}
            className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand/90"
          >
            下载模型
          </button>
        )}
        {downloading && (
          <button
            onClick={handleCancel}
            className="rounded-md border border-border bg-surface-2 px-4 py-1.5 text-sm text-text-secondary hover:bg-surface-3"
          >
            取消
          </button>
        )}
        {status.downloaded && !downloading && (
          <>
            <div className="flex-1 rounded-md bg-green-500/10 px-3 py-1.5 text-xs text-green-600">
              ✓ 点击「一键去废话」时自动使用此模型，优先于 API 提供商
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-text-muted hover:bg-danger/10 hover:text-danger"
            >
              {deleting ? '删除中...' : '删除'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
