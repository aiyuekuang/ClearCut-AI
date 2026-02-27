// TranscriptEditor - the core editing surface
// Click → seek video; Double-click → inline edit word text
// Right-click / Delete key → toggle delete; Low-confidence words tinted orange

import { useCallback, useState, useEffect, useRef, Fragment, useMemo } from 'react'
import { Dropdown } from 'antd'
import { useEditorStore, type EditSegment } from '@/stores/editorStore'
import { cn } from '@/lib/utils'

const STATUS_CLASS: Record<EditSegment['status'], string> = {
  kept:    'text-text cursor-pointer hover:bg-surface-3/60 rounded',
  deleted: 'text-text-muted/40 line-through cursor-pointer hover:bg-surface-3/60 rounded',
  silence: 'text-text-muted/25 cursor-pointer hover:bg-surface-3/60 rounded',
  filler:  'text-amber-400/60 line-through cursor-pointer hover:bg-surface-3/60 rounded',
}

// Orange tint for low-confidence kept words; suppressed when word is actively playing
function getConfidenceStyle(
  confidence: number,
  status: EditSegment['status'],
  isActivePlaying: boolean,
): React.CSSProperties | undefined {
  if (status !== 'kept' || isActivePlaying || confidence >= 0.85) return undefined
  const alpha = (1 - confidence) * 0.48
  return { backgroundColor: `rgba(251, 146, 60, ${alpha})`, borderRadius: 3 }
}

type Props = {
  onWordClick?: (start: number) => void
  highlightText?: string
  compact?: boolean   // narrow left-panel mode
}

export function TranscriptEditor({ onWordClick, highlightText, compact }: Props) {
  const segments         = useEditorStore((s) => s.segments)
  const activeId         = useEditorStore((s) => s.activeSegmentId)
  const currentTime      = useEditorStore((s) => s.currentTime)
  const isPlaying        = useEditorStore((s) => s.isPlaying)
  const toggleSegment    = useEditorStore((s) => s.toggleSegment)
  const setActiveSegment = useEditorStore((s) => s.setActiveSegment)
  const updateWord       = useEditorStore((s) => s.updateWord)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef  = useRef<HTMLInputElement>(null)
  const wordRefs  = useRef<Map<string, HTMLElement>>(new Map())

  // Currently-speaking word during playback
  const playingId = useMemo(() => {
    if (!isPlaying) return null
    for (const seg of segments) {
      if (seg.status === 'kept' && currentTime >= seg.start && currentTime <= seg.end) {
        return seg.id
      }
    }
    return null
  }, [currentTime, isPlaying, segments])

  // Auto-scroll to keep playing word visible (only scrolls when word goes out of view)
  useEffect(() => {
    if (!playingId || !isPlaying) return
    wordRefs.current.get(playingId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [playingId, isPlaying])

  // Delete / Backspace → toggle active segment
  useEffect(() => {
    if (!activeId) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        toggleSegment(activeId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId, toggleSegment])

  // Clean up stale refs when segments array changes
  useEffect(() => {
    const current = new Set(segments.map((s) => s.id))
    for (const id of wordRefs.current.keys()) {
      if (!current.has(id)) wordRefs.current.delete(id)
    }
  }, [segments])

  useEffect(() => {
    if (editingId) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editingId])

  const handleClick = useCallback(
    (seg: EditSegment) => {
      if (editingId) return
      setActiveSegment(seg.id)
      onWordClick?.(seg.start)
    },
    [setActiveSegment, onWordClick, editingId],
  )

  const handleDoubleClick = useCallback((seg: EditSegment) => {
    setEditingId(seg.id)
    setEditValue(seg.word)
  }, [])

  const handleEditCommit = useCallback(() => {
    if (editingId) {
      const trimmed = editValue.trim()
      if (trimmed) updateWord(editingId, trimmed)
    }
    setEditingId(null)
  }, [editingId, editValue, updateWord])

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') { e.preventDefault(); handleEditCommit() }
      if (e.key === 'Escape') setEditingId(null)
    },
    [handleEditCommit],
  )

  const renderWordText = (word: string) => {
    if (!highlightText || !word.includes(highlightText)) return word
    const parts = word.split(highlightText)
    return (
      <>
        {parts.map((part, i) => (
          <Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <mark className="rounded-sm bg-yellow-300/80 px-0.5 text-black">
                {highlightText}
              </mark>
            )}
          </Fragment>
        ))}
      </>
    )
  }

  if (segments.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-center text-[12px] leading-6 text-text-muted">
          转录完成后文本将显示在此
          <br />
          <span className="text-text-muted/50">点击定位 · 双击编辑</span>
        </p>
      </div>
    )
  }

  return (
    <div className={cn('flex-1 overflow-y-auto', compact ? 'px-3 py-3' : 'px-8 py-6')}>

      {/* Legend — always show core colors, compact gets minimal version */}
      <div className={cn(
        'mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 select-none',
        compact ? 'text-[10px] text-text-muted/50' : 'text-[11px] text-text-muted/60',
      )}>
        <span>点击定位 · 双击编辑 · <kbd className="rounded bg-surface-3 px-1 font-mono text-[9px]">Del</kbd> 删除</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-brand/30 ring-1 ring-brand/50" />
          播放中
        </span>
        <span className="text-amber-400/70">黄=填充</span>
        {!compact && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-orange-400/40" />
            低置信度
          </span>
        )}
      </div>

      {/* Text body */}
      <div
        className={cn(
          'leading-[2.4] tracking-wide',
          compact ? 'text-[13px]' : 'mx-auto max-w-2xl text-[14px]',
        )}
      >
        {segments.map((seg, i) => (
          <span key={seg.id}>
            {editingId === seg.id ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleEditCommit}
                onKeyDown={handleEditKeyDown}
                className="inline-block rounded border border-brand bg-surface-2 px-1 py-0.5 text-[13px] text-text outline-none ring-1 ring-brand"
                style={{ width: `${Math.max(editValue.length * 13 + 16, 40)}px` }}
              />
            ) : (
              <Dropdown
                trigger={['contextMenu']}
                menu={{
                  items: [
                    {
                      key: 'toggle',
                      label: seg.status === 'kept' ? '标记删除 (Del)' : '恢复保留 (Del)',
                      onClick: () => toggleSegment(seg.id),
                    },
                    {
                      key: 'edit',
                      label: '编辑文字',
                      onClick: () => { setEditingId(seg.id); setEditValue(seg.word) },
                    },
                  ],
                  style: { minWidth: 120 },
                }}
              >
                <span
                  ref={(el) => {
                    if (el) wordRefs.current.set(seg.id, el)
                    else wordRefs.current.delete(seg.id)
                  }}
                  className={cn(
                    'select-none px-0.5 py-0.5 transition-colors duration-75',
                    STATUS_CLASS[seg.status],
                    // Playing: brand highlight takes priority
                    playingId === seg.id && '!bg-brand/20 !text-brand rounded ring-1 ring-brand/30',
                    // Active (clicked, not playing): subtle ring
                    !isPlaying && activeId === seg.id && seg.status === 'kept' && 'ring-1 ring-brand/50 rounded',
                  )}
                  style={getConfidenceStyle(seg.confidence, seg.status, playingId === seg.id)}
                  onClick={() => handleClick(seg)}
                  onDoubleClick={() => handleDoubleClick(seg)}
                  title={`${seg.start.toFixed(2)}s – ${seg.end.toFixed(2)}s · 置信度 ${Math.round(seg.confidence * 100)}%`}
                >
                  {renderWordText(seg.word)}
                </span>
              </Dropdown>
            )}
            {seg.isSentenceEnd && i < segments.length - 1 && (
              <span className="my-3 block" />
            )}
          </span>
        ))}
      </div>

      <div className="h-8" />
    </div>
  )
}
