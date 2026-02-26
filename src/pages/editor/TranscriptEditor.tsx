// TranscriptEditor - the core editing surface
// Click → seek video; Double-click → inline edit word text
// Right-click → context menu via antd Dropdown; Deleted words shown struck-through

import { useCallback, useState, useEffect, useRef, Fragment } from 'react'
import { Dropdown } from 'antd'
import { useEditorStore, type EditSegment } from '@/stores/editorStore'
import { cn } from '@/lib/utils'

// Status → CSS class mapping
const STATUS_CLASS: Record<EditSegment['status'], string> = {
  kept:    'text-text cursor-pointer hover:bg-surface-2 rounded',
  deleted: 'text-text-muted line-through cursor-pointer hover:bg-surface-2 rounded opacity-50',
  silence: 'text-text-muted/40 cursor-pointer hover:bg-surface-2 rounded text-xs',
  filler:  'text-yellow-500/70 line-through cursor-pointer hover:bg-surface-2 rounded',
}

type Props = {
  onWordClick?: (start: number) => void
  highlightText?: string
}

export function TranscriptEditor({ onWordClick, highlightText }: Props) {
  const segments         = useEditorStore((s) => s.segments)
  const activeId         = useEditorStore((s) => s.activeSegmentId)
  const toggleSegment    = useEditorStore((s) => s.toggleSegment)
  const setActiveSegment = useEditorStore((s) => s.setActiveSegment)
  const updateWord       = useEditorStore((s) => s.updateWord)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

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
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-center text-xs text-text-muted leading-6">
          转录完成后，文本将在此显示。
          <br />
          点击单词跳转定位，双击编辑文字。
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 leading-loose">
      <p className="mb-4 text-[11px] text-text-muted opacity-70 select-none">
        点击定位 · 双击编辑 · 右键删除/恢复 ·
        <span className="text-yellow-500/70 ml-1">黄色</span>填充词
      </p>
      <div className="text-[13px]">
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
                style={{ width: `${Math.max(editValue.length * 14 + 16, 48)}px` }}
              />
            ) : (
              <Dropdown
                trigger={['contextMenu']}
                menu={{
                  items: [
                    {
                      key: 'toggle',
                      label: seg.status === 'kept' ? '标记删除' : '恢复保留',
                      onClick: () => toggleSegment(seg.id),
                    },
                    {
                      key: 'edit',
                      label: '编辑文字',
                      onClick: () => {
                        setEditingId(seg.id)
                        setEditValue(seg.word)
                      },
                    },
                  ],
                  style: { minWidth: 120 },
                }}
              >
                <span
                  className={cn(
                    'select-none px-0.5 py-0.5 transition-colors',
                    STATUS_CLASS[seg.status],
                    activeId === seg.id && 'ring-1 ring-brand rounded',
                  )}
                  onClick={() => handleClick(seg)}
                  onDoubleClick={() => handleDoubleClick(seg)}
                  title={`${seg.start.toFixed(2)}s – ${seg.end.toFixed(2)}s  (${Math.round(seg.confidence * 100)}%)`}
                >
                  {renderWordText(seg.word)}
                </span>
              </Dropdown>
            )}
            {seg.isSentenceEnd && i < segments.length - 1 && (
              <span className="my-2 block" />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
