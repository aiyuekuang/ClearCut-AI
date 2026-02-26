// FindReplaceBar - find and batch-replace text across transcript segments

import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'

type Props = {
  onClose: () => void
  onFindChange: (text: string) => void
}

export function FindReplaceBar({ onClose, onFindChange }: Props) {
  const [findText, setFindText]       = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [lastCount, setLastCount]     = useState<number | null>(null)

  const segments    = useEditorStore((s) => s.segments)
  const replaceWords = useEditorStore((s) => s.replaceWords)

  const matchCount = useMemo(() => {
    if (!findText) return 0
    return segments.filter((s) => s.word.includes(findText)).length
  }, [findText, segments])

  const handleFindChange = (text: string) => {
    setFindText(text)
    setLastCount(null)
    onFindChange(text)
  }

  const handleReplaceAll = () => {
    if (!findText || matchCount === 0) return
    const count = replaceWords(findText, replaceText)
    setLastCount(count)
    // Clear find highlight after replace
    setFindText('')
    onFindChange('')
  }

  const handleClose = () => {
    onFindChange('')
    onClose()
  }

  return (
    <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-2">
      {/* Find */}
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          placeholder="查找"
          value={findText}
          onChange={(e) => handleFindChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && handleClose()}
          className="h-7 w-36 rounded border border-border bg-surface px-2 text-xs focus:border-brand focus:outline-none"
        />
        {findText && (
          <span className="whitespace-nowrap text-xs text-text-muted">
            {matchCount} 处匹配
          </span>
        )}
      </div>

      <span className="text-xs text-text-muted">→</span>

      {/* Replace */}
      <input
        placeholder="替换为"
        value={replaceText}
        onChange={(e) => setReplaceText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleReplaceAll(); if (e.key === 'Escape') handleClose() }}
        className="h-7 w-36 rounded border border-border bg-surface px-2 text-xs focus:border-brand focus:outline-none"
      />

      <button
        onClick={handleReplaceAll}
        disabled={!findText || matchCount === 0}
        className="rounded bg-brand/15 px-2.5 py-1 text-xs text-brand hover:bg-brand/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        全部替换
      </button>

      {/* Result feedback */}
      {lastCount !== null && (
        <span className="text-xs text-green-400">✓ 已替换 {lastCount} 处</span>
      )}

      <button
        onClick={handleClose}
        className="ml-auto rounded p-1 text-text-muted hover:bg-surface-3 hover:text-text"
        title="关闭"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
